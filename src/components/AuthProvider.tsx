"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as api from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Bumped on every sign-in/out so the cart can re-fetch under the new identity. */
  authVersion: number;
  signIn: (email: string, password: string, cartId?: string) => Promise<void>;
  signUp: (
    payload: { email: string; password: string; full_name: string },
    cartId?: string,
  ) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the JWT and the signed-in shopper.
 *
 * Wraps CartProvider rather than sitting beside it: signing in hands the guest
 * cart to the new account server-side, so the cart has to reload afterwards and
 * needs a signal that identity changed.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authVersion, setAuthVersion] = useState(0);

  // Resume an existing session. A rejected token is simply dropped.
  useEffect(() => {
    if (!api.getToken()) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then(setUser)
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string, cartId?: string) => {
    const token = await api.login({ email, password, cart_id: cartId });
    api.setToken(token.access_token);
    setUser(token.user);
    setAuthVersion((v) => v + 1);
  }, []);

  const signUp = useCallback(
    async (
      payload: { email: string; password: string; full_name: string },
      cartId?: string,
    ) => {
      const token = await api.register({ ...payload, cart_id: cartId });
      api.setToken(token.access_token);
      setUser(token.user);
      setAuthVersion((v) => v + 1);
    },
    [],
  );

  const signOut = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setAuthVersion((v) => v + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, authVersion, signIn, signUp, signOut }),
    [user, loading, authVersion, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
