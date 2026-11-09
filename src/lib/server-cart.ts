import { cookies } from "next/headers";

import { getCart } from "./api";
import { CART_COOKIE } from "./cart-cookie";
import type { Cart } from "./types";

/**
 * Resolves the visitor's cart during server rendering. Returns null on the first
 * visit (no cookie yet) or if the id no longer resolves — callers treat both as
 * "no vehicle selected", which is the same state the design starts in.
 */
export async function getServerCart(): Promise<Cart | null> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return null;

  try {
    return await getCart(cartId);
  } catch {
    return null;
  }
}
