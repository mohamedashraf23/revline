"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import * as api from "@/lib/api";
import type { OrderSummary } from "@/lib/types";

import { useAuth } from "./AuthProvider";

export function AccountOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    let cancelled = false;
    api
      .getMyOrders()
      .then((rows) => {
        if (!cancelled) setOrders(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load orders");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <section className="orders">
        <h2 className="h2 h2--rail">Order history</h2>
        <p className="orders__empty">
          <Link href="/signin?next=/account">Sign in</Link> to see your past orders. Your saved
          vehicles will move across with you.
        </p>
      </section>
    );
  }

  return (
    <section className="orders">
      <h2 className="h2 h2--rail">Order history</h2>

      {error && <div className="form-error">{error}</div>}

      {orders === null ? (
        <p className="orders__empty">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="orders__empty">
          No orders yet. <Link href="/shop">Browse parts →</Link>
        </p>
      ) : (
        <table className="orders__table">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Date</th>
              <th scope="col">Vehicle</th>
              <th scope="col">Items</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_number}>
                <td>
                  <Link href={`/order/${order.order_number}`}>#{order.order_number}</Link>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                <td>{order.vehicle_label ?? "—"}</td>
                <td>{order.item_count}</td>
                <td>{api.money(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
