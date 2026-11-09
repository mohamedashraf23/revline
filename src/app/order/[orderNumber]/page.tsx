import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, getOrder, money } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order confirmed — Revline" };

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  let order;
  try {
    order = await getOrder(orderNumber);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <div className="confirmation">
      <div className="confirmation__check" aria-hidden>
        ✓
      </div>
      <h1 className="confirmation__title">Order confirmed</h1>
      <div className="confirmation__body">
        Order #{order.order_number} is on its way.
        {order.email
          ? ` A confirmation has been sent to ${order.email}.`
          : " A confirmation has been sent to your email."}
        {order.vehicle_label && (
          <div className="confirmation__vehicle">Ordered for your {order.vehicle_label}</div>
        )}
      </div>

      <div className="panel confirmation__lines">
        <div className="panel__title">What you ordered</div>
        {order.items.map((item) => (
          <div key={item.product_id} className="summary-row">
            <div>
              {item.product_name} × {item.quantity}
              {item.product_sku && <span className="summary-row__sku"> {item.product_sku}</span>}
            </div>
            <div>{money(item.unit_price * item.quantity)}</div>
          </div>
        ))}
        <div className="summary-row">
          <div>Shipping</div>
          <div>{order.shipping === 0 ? "Free" : money(order.shipping)}</div>
        </div>
        <div className="summary-row">
          <div>Tax</div>
          <div>{money(order.tax)}</div>
        </div>
        <div className="summary-total">
          <div>Total</div>
          <div>{money(order.total)}</div>
        </div>
        <div className="summary-row" style={{ marginBottom: 0 }}>
          <div>Paid with</div>
          <div>•••• {order.card_last4}</div>
        </div>
      </div>

      <Link href="/" className="btn btn--sm" style={{ color: "white" }}>
        Back to Home
      </Link>
    </div>
  );
}
