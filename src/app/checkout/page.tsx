"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { money, placeOrder } from "@/lib/api";

const EMPTY_FORM = {
  full_name: "",
  address: "",
  city: "",
  state: "",
  postal_code: "",
  email: "",
  card_number: "",
  exp: "",
  cvv: "",
};

type Form = typeof EMPTY_FORM;
type Errors = Partial<Record<keyof Form, string>>;

function validate(form: Form): Errors {
  const errors: Errors = {};
  if (!form.full_name.trim()) errors.full_name = "Required";
  if (!form.address.trim()) errors.address = "Required";
  if (!form.city.trim()) errors.city = "Required";
  if (!form.state.trim()) errors.state = "Required";
  if (!/^\d{3,10}$/.test(form.postal_code.trim())) errors.postal_code = "Enter a valid ZIP";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email";

  const digits = form.card_number.replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 19) errors.card_number = "Enter a valid card number";
  if (!/^\d{2}\s*\/\s*\d{2,4}$/.test(form.exp)) errors.exp = "Use MM/YY";
  if (!/^\d{3,4}$/.test(form.cvv)) errors.cvv = "3–4 digits";

  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, loading, refresh } = useCart();

  const [form, setForm] = useState<Form>(EMPTY_FORM);

  // Prefill from the account once it resolves, without clobbering anything the
  // shopper has already typed.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      email: prev.email || user.email,
      full_name: prev.full_name || user.full_name,
    }));
  }, [user]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fieldClass = (key: keyof Form, extra = "") =>
    `field field--lg ${extra}${errors[key] ? " field-error" : ""}`.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cart || cart.items.length === 0) {
      setSubmitError("Your cart is empty.");
      return;
    }

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await placeOrder({
        cart_id: cart.id,
        email: form.email.trim() || undefined,
        shipping: {
          full_name: form.full_name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          postal_code: form.postal_code.trim(),
        },
        payment: {
          card_number: form.card_number.replace(/\s/g, ""),
          exp: form.exp,
          cvv: form.cvv,
        },
      });
      await refresh(); // the API emptied the cart; sync the header badge
      router.push(`/order/${order.order_number}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not place the order.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page page--narrow">
        <h1 className="page-title page-title--sm">Checkout</h1>
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="page page--narrow">
        <h1 className="page-title page-title--sm">Checkout</h1>
        <div className="empty">
          <div className="empty__text">There is nothing to check out yet.</div>
          <Link href="/shop" className="btn btn--sm">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <h1 className="page-title page-title--sm">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="cart-layout">
          <div className="checkout-forms">
            <div className="panel">
              <div className="panel__title panel__title--sm">Shipping Address</div>
              <div className="form-grid">
                <input
                  className={fieldClass("full_name", "span-2")}
                  placeholder="Full name"
                  autoComplete="name"
                  value={form.full_name}
                  onChange={update("full_name")}
                  aria-label="Full name"
                />
                <input
                  className={fieldClass("address", "span-2")}
                  placeholder="Address"
                  autoComplete="street-address"
                  value={form.address}
                  onChange={update("address")}
                  aria-label="Address"
                />
                <input
                  className={fieldClass("city")}
                  placeholder="City"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={update("city")}
                  aria-label="City"
                />
                <input
                  className={fieldClass("state")}
                  placeholder="State"
                  autoComplete="address-level1"
                  value={form.state}
                  onChange={update("state")}
                  aria-label="State"
                />
                <input
                  className={fieldClass("postal_code")}
                  placeholder="ZIP"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={form.postal_code}
                  onChange={update("postal_code")}
                  aria-label="ZIP code"
                />
                <input
                  className={fieldClass("email")}
                  placeholder="Email (for the receipt)"
                  autoComplete="email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  aria-label="Email"
                />
              </div>
            </div>

            <div className="panel">
              <div className="panel__title panel__title--sm">Payment</div>
              <div className="form-grid form-grid--3">
                <input
                  className={fieldClass("card_number", "span-3")}
                  placeholder="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={form.card_number}
                  onChange={update("card_number")}
                  aria-label="Card number"
                />
                <input
                  className={fieldClass("exp")}
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                  value={form.exp}
                  onChange={update("exp")}
                  aria-label="Expiry"
                />
                <input
                  className={fieldClass("cvv")}
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={form.cvv}
                  onChange={update("cvv")}
                  aria-label="CVV"
                />
              </div>
              <p className="payment-note">
                Demo checkout — no card is charged and only the last four digits are stored. Wire a
                payment provider (Stripe, Adyen) before taking real cards.
              </p>
            </div>
          </div>

          <div className="panel">
            <div className="panel__title">Order Summary</div>
            <div className="summary-row">
              <div>Subtotal</div>
              <div>{money(cart.totals.subtotal)}</div>
            </div>
            <div className="summary-row">
              <div>Shipping</div>
              <div>{cart.totals.shipping === 0 ? "Free" : money(cart.totals.shipping)}</div>
            </div>
            <div className="summary-row">
              <div>Est. tax</div>
              <div>{money(cart.totals.tax)}</div>
            </div>
            <div className="summary-total">
              <div>Total</div>
              <div>{money(cart.totals.total)}</div>
            </div>
            {submitError && <div className="form-error">{submitError}</div>}
            <button type="submit" className="btn btn--block" disabled={submitting}>
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
