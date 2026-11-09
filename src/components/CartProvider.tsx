"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import * as api from "@/lib/api";
import { CART_COOKIE } from "@/lib/cart-cookie";
import type { Cart, GarageVehicle } from "@/lib/types";

import { useAuth } from "./AuthProvider";

const STORAGE_KEY = "revline.cartId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The id is mirrored into a cookie so server components (shop listing, product
 * page) can resolve the saved vehicle and render fitment without a client round trip.
 */
function persistCartId(cartId: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, cartId);
  } catch {
    /* private mode — the cookie below still carries us through this session */
  }
  document.cookie = `${CART_COOKIE}=${cartId}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function forgetCartId() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${CART_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

interface CartContextValue {
  cart: Cart | null;
  garage: GarageVehicle[];
  loading: boolean;
  error: string | null;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  /** Saves the vehicle if it is new, then makes it the active one. */
  selectVehicle: (vehicle: {
    year: number;
    make_slug: string;
    model_slug: string;
    nickname?: string | null;
  }) => Promise<void>;
  selectGarageVehicle: (id: number) => Promise<void>;
  removeGarageVehicle: (id: number) => Promise<void>;
  clearVehicle: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Carts live on the server; the browser only keeps the cart id. That way totals,
 * fitment and stock rules stay in one place (the Python API) and survive reloads.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { authVersion, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [garage, setGarage] = useState<GarageVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastAuthVersion = useRef(-1);

  const ensureCart = useCallback(async (): Promise<Cart> => {
    let storedId: string | null = null;
    try {
      storedId = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    if (storedId) {
      try {
        const existing = await api.getCart(storedId);
        persistCartId(existing.id); // refresh the cookie's TTL
        return existing;
      } catch (err) {
        // A stale id (server wiped, cart expired) or a cart now owned by
        // another account should not strand the shopper — start a new one.
        if (!(err instanceof api.ApiError) || ![403, 404].includes(err.status)) throw err;
        forgetCartId();
      }
    }

    const created = await api.createCart();
    persistCartId(created.id);
    return created;
  }, []);

  const loadGarage = useCallback(async (cartId: string) => {
    try {
      setGarage(await api.getGarage(cartId));
    } catch {
      setGarage([]);
    }
  }, []);

  // Load once, then again whenever the signed-in identity changes.
  useEffect(() => {
    if (authLoading || lastAuthVersion.current === authVersion) return;
    lastAuthVersion.current = authVersion;

    setLoading(true);
    ensureCart()
      .then(async (next) => {
        setCart(next);
        await loadGarage(next.id);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Cart unavailable"))
      .finally(() => setLoading(false));
  }, [authLoading, authVersion, ensureCart, loadGarage]);

  const run = useCallback(
    async (action: (cartId: string) => Promise<Cart>, reloadGarage = false) => {
      setError(null);
      try {
        const current = cart ?? (await ensureCart());
        const next = await action(current.id);
        setCart(next);
        if (reloadGarage) await loadGarage(next.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        throw err;
      }
    },
    [cart, ensureCart, loadGarage],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      garage,
      loading,
      error,
      addItem: (productId, quantity = 1) =>
        run((cartId) => api.addCartItem(cartId, productId, quantity)),
      setQuantity: (productId, quantity) =>
        run((cartId) => api.setCartItemQuantity(cartId, productId, quantity)),
      removeItem: (productId) => run((cartId) => api.removeCartItem(cartId, productId)),

      selectVehicle: (vehicle) =>
        run(
          (cartId) =>
            api.setCartVehicle(cartId, {
              year: vehicle.year,
              make_slug: vehicle.make_slug,
              model_slug: vehicle.model_slug,
            }),
          true,
        ),
      selectGarageVehicle: (id) =>
        run((cartId) => api.setCartVehicle(cartId, { garage_vehicle_id: id })),
      removeGarageVehicle: (id) =>
        run(async (cartId) => {
          await api.removeGarageVehicle(id, cartId);
          return api.getCart(cartId);
        }, true),

      clearVehicle: () => run((cartId) => api.clearCartVehicle(cartId)),
      refresh: () => run((cartId) => api.getCart(cartId), true),
    }),
    [cart, garage, loading, error, run],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
