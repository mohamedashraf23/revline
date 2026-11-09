"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";

import { useCart } from "./CartProvider";

export function AddToCart({
  productId,
  inStock,
  stockQuantity,
}: {
  productId: string;
  inStock: boolean;
  stockQuantity: number;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cap the stepper at what is actually on the shelf, so the 409 from the API
  // is a backstop rather than the first thing the shopper sees.
  const max = Math.max(1, Math.min(99, stockQuantity));

  async function handleAdd() {
    setBusy(true);
    setError(null);
    try {
      await addItem(productId, quantity);
      router.push("/cart");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not add this part to your cart.",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <div className="buy-row">
        <div className="stepper">
          <button
            type="button"
            className="stepper__btn"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <div className="stepper__value" aria-live="polite">
            {quantity}
          </div>
          <button
            type="button"
            className="stepper__btn"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button type="button" className="btn" onClick={handleAdd} disabled={busy || !inStock}>
          {inStock ? (busy ? "Adding…" : "Add to Cart") : "Out of Stock"}
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}
    </>
  );
}
