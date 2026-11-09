"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/CartProvider";
import { FitBadge } from "@/components/FitBadge";
import { PartArt } from "@/components/PartArt";
import { money } from "@/lib/api";

export default function CartPage() {
  const { cart, loading, error, setQuantity, removeItem } = useCart();
  const [pending, setPending] = useState<string | null>(null);

  async function mutate(productId: string, action: () => Promise<void>) {
    setPending(productId);
    try {
      await action();
    } catch {
      /* the provider surfaces the error */
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return (
      <div className="page page--narrow">
        <h1 className="page-title page-title--sm">Your Cart</h1>
        <div className="skeleton" style={{ height: 104 }} />
      </div>
    );
  }

  const items = cart?.items ?? [];
  const totals = cart?.totals;
  const vehicle = cart?.vehicle ?? null;

  // A line that does not fit the selected vehicle is worth saying out loud
  // before checkout, not after delivery.
  const misfits = items.filter(
    (item) => item.fits_vehicle === "no" || item.fits_vehicle === "partial",
  );

  return (
    <div className="page page--narrow">
      <h1 className="page-title page-title--sm">Your Cart</h1>

      {error && <div className="form-error">{error}</div>}

      {vehicle && misfits.length > 0 && (
        <div className="notice notice--warn">
          <div>
            {misfits.length === 1 ? "One part" : `${misfits.length} parts`} in your cart{" "}
            {misfits.length === 1 ? "is" : "are"} not listed to fit your{" "}
            <strong>{vehicle.label}</strong>.
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty__text">Your cart is empty.</div>
          <Link href="/shop" className="btn btn--sm">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((item) => (
              <div key={item.product_id} className="cart-line">
                <div className="cart-line__art">
                  <PartArt sku={item.sku} category={item.category} className="cart-line__svg" />
                </div>
                <div className="cart-line__info">
                  <div className="cart-line__name">
                    <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  </div>
                  <div className="cart-line__category">
                    {item.category} · {item.sku}
                  </div>
                  <FitBadge status={item.fits_vehicle} compact />
                </div>
                <div className="stepper stepper--sm">
                  <button
                    type="button"
                    className="stepper__btn"
                    disabled={pending === item.product_id}
                    onClick={() =>
                      mutate(item.product_id, () =>
                        setQuantity(item.product_id, item.quantity - 1),
                      )
                    }
                    aria-label={`Decrease quantity of ${item.name}`}
                  >
                    −
                  </button>
                  <div className="stepper__value">{item.quantity}</div>
                  <button
                    type="button"
                    className="stepper__btn"
                    disabled={
                      pending === item.product_id ||
                      item.quantity >= Math.min(99, item.stock_quantity)
                    }
                    onClick={() =>
                      mutate(item.product_id, () =>
                        setQuantity(item.product_id, item.quantity + 1),
                      )
                    }
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <div className="cart-line__total">{money(item.line_total)}</div>
                <button
                  type="button"
                  className="cart-line__remove"
                  disabled={pending === item.product_id}
                  onClick={() => mutate(item.product_id, () => removeItem(item.product_id))}
                  aria-label={`Remove ${item.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel__title">Order Summary</div>
            <div className="summary-row">
              <div>Subtotal</div>
              <div>{money(totals?.subtotal ?? 0)}</div>
            </div>
            <div className="summary-row">
              <div>Shipping</div>
              <div>{totals && totals.shipping === 0 ? "Free" : money(totals?.shipping ?? 0)}</div>
            </div>
            <div className="summary-row">
              <div>Est. tax</div>
              <div>{money(totals?.tax ?? 0)}</div>
            </div>
            <div className="summary-total">
              <div>Total</div>
              <div>{money(totals?.total ?? 0)}</div>
            </div>
            <Link
              href="/checkout"
              className="btn btn--block"
              style={{ display: "block", textAlign: "center", color: "white" }}
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
