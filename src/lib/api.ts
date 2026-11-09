import type {
  AuthToken,
  Cart,
  Category,
  GarageVehicle,
  ModelSearchHit,
  Order,
  OrderSummary,
  PaymentDetails,
  ProductDetail,
  ProductList,
  ProductQuery,
  ShippingAddress,
  User,
  VehicleModel,
  VehicleOptions,
} from "./types";

/**
 * Server components talk to the API over the internal address (which may differ
 * inside Docker); the browser always uses the public one.
 */
const BASE =
  typeof window === "undefined"
    ? process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
    : process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly fields?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path, BASE);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * The browser keeps its token in localStorage. Server components never have one
 * — they read what the cart cookie exposes, which is public-by-id anyway.
 */
const TOKEN_KEY = "revline.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session just will not persist across reloads */
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { query?: Query; auth?: boolean } = {},
): Promise<T> {
  const { query, auth = true, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    let fields: { field: string; message: string }[] | undefined;
    try {
      const body = await response.json();
      // The API wraps every error as {error: {code, message, detail}}.
      if (body?.error) {
        code = body.error.code;
        message = body.error.message ?? message;
        if (Array.isArray(body.error.detail)) {
          fields = body.error.detail;
          if (fields?.length) message = `${message}: ${fields[0].message}`;
        }
      } else if (typeof body?.detail === "string") {
        message = body.detail;
      }
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiError(message, response.status, code, fields);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ---------------------------------------------------------------- catalog */

export const getCategories = () => request<Category[]>("/api/categories");

export const getProducts = (query: ProductQuery) =>
  request<ProductList>("/api/products", { query: query as Query });

export const getBestSellers = (query: { limit?: number; cart_id?: string } = {}) =>
  request<ProductList>("/api/products/best-sellers", { query });

export const getProduct = (key: string, query: { cart_id?: string } = {}) =>
  request<ProductDetail>(`/api/products/${encodeURIComponent(key)}`, { query });

export const getRelatedProducts = (
  key: string,
  query: { limit?: number; cart_id?: string } = {},
) => request<ProductList>(`/api/products/${encodeURIComponent(key)}/related`, { query });

/* --------------------------------------------------------------- vehicles */

export const getVehicleOptions = () => request<VehicleOptions>("/api/vehicles/options");

export const getModelsForMake = (makeSlug: string, year?: number) =>
  request<VehicleModel[]>(`/api/vehicles/makes/${encodeURIComponent(makeSlug)}/models`, {
    query: { year },
  });

export const searchModels = (q: string, query: { limit?: number; year?: number } = {}) =>
  request<ModelSearchHit[]>("/api/vehicles/search", { query: { q, ...query } });

/* ----------------------------------------------------------------- garage */

export const getGarage = (cartId?: string) =>
  request<GarageVehicle[]>("/api/garage", { query: { cart_id: cartId } });

export const addGarageVehicle = (
  vehicle: { year: number; make_slug: string; model_slug: string; nickname?: string | null },
  cartId?: string,
) =>
  request<GarageVehicle>("/api/garage", {
    method: "POST",
    query: { cart_id: cartId },
    body: JSON.stringify(vehicle),
  });

export const removeGarageVehicle = (id: number, cartId?: string) =>
  request<void>(`/api/garage/${id}`, { method: "DELETE", query: { cart_id: cartId } });

/* ------------------------------------------------------------------- auth */

export const register = (payload: {
  email: string;
  password: string;
  full_name: string;
  cart_id?: string;
}) => request<AuthToken>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });

export const login = (payload: { email: string; password: string; cart_id?: string }) =>
  request<AuthToken>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });

export const getMe = () => request<User>("/api/auth/me");

export const getMyOrders = () => request<OrderSummary[]>("/api/auth/me/orders");

/* ------------------------------------------------------------------- cart */

export const createCart = () => request<Cart>("/api/carts", { method: "POST" });

export const getCart = (cartId: string) => request<Cart>(`/api/carts/${cartId}`);

export const addCartItem = (cartId: string, productId: string, quantity = 1) =>
  request<Cart>(`/api/carts/${cartId}/items`, {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });

export const setCartItemQuantity = (cartId: string, productId: string, quantity: number) =>
  request<Cart>(`/api/carts/${cartId}/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });

export const removeCartItem = (cartId: string, productId: string) =>
  request<Cart>(`/api/carts/${cartId}/items/${productId}`, { method: "DELETE" });

/** Selects a garage entry, or saves an ad-hoc vehicle and selects it. */
export const setCartVehicle = (
  cartId: string,
  vehicle:
    | { garage_vehicle_id: number }
    | { year: number; make_slug: string; model_slug: string },
) =>
  request<Cart>(`/api/carts/${cartId}/vehicle`, {
    method: "PUT",
    body: JSON.stringify(vehicle),
  });

export const clearCartVehicle = (cartId: string) =>
  request<Cart>(`/api/carts/${cartId}/vehicle`, { method: "DELETE" });

/* ----------------------------------------------------------------- orders */

export const placeOrder = (payload: {
  cart_id: string;
  email?: string;
  shipping: ShippingAddress;
  payment: PaymentDetails;
}) => request<Order>("/api/orders", { method: "POST", body: JSON.stringify(payload) });

export const getOrder = (orderNumber: number | string) =>
  request<Order>(`/api/orders/${orderNumber}`);

/* ---------------------------------------------------------------- helpers */

export const money = (value: number) => `$${value.toFixed(2)}`;
