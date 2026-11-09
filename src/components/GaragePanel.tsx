"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { VehicleOptions } from "@/lib/types";

import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { VehicleFinder } from "./VehicleFinder";

/**
 * My Garage: the saved vehicles, which one is driving fitment, and a way to add
 * another. Works signed out too — a guest garage hangs off the cart and moves
 * to the account on sign-up.
 */
export function GaragePanel({ options }: { options: VehicleOptions }) {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, garage, selectGarageVehicle, removeGarageVehicle } = useCart();
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const activeId = cart?.vehicle?.id ?? null;

  async function activate(id: number) {
    setBusyId(id);
    try {
      await selectGarageVehicle(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function drop(id: number) {
    setBusyId(id);
    try {
      await removeGarageVehicle(id);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="garage">
      <div className="garage__head">
        <h2 className="h2 h2--rail">My Garage</h2>
        <button type="button" className="btn btn--ghost" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "Add a vehicle"}
        </button>
      </div>

      {!user && garage.length > 0 && (
        <p className="garage__note">
          These are saved to this browser. Create an account and they move with you.
        </p>
      )}

      {adding && (
        <div className="garage__add">
          <VehicleFinder options={options} compact onDone={() => setAdding(false)} />
        </div>
      )}

      {garage.length === 0 && !adding ? (
        <p className="garage__empty">
          No vehicles saved yet. Add one and the whole catalogue gets filtered to parts that
          actually fit it.
        </p>
      ) : (
        <ul className="garage__list">
          {garage.map((vehicle) => {
            const active = vehicle.id === activeId;
            return (
              <li key={vehicle.id} className={`garage__item${active ? " garage__item--active" : ""}`}>
                <div className="garage__info">
                  <div className="garage__label">
                    {vehicle.label}
                    {active && <span className="garage__flag">Active</span>}
                  </div>
                  <div className="garage__meta">
                    {vehicle.nickname ? `${vehicle.nickname} · ` : ""}
                    {vehicle.body_style}
                    {vehicle.powertrain !== "ice" ? ` · ${vehicle.powertrain.toUpperCase()}` : ""}
                  </div>
                </div>
                <div className="garage__actions">
                  {!active && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => activate(vehicle.id)}
                      disabled={busyId === vehicle.id}
                    >
                      Use this
                    </button>
                  )}
                  <button
                    type="button"
                    className="garage__remove"
                    onClick={() => drop(vehicle.id)}
                    disabled={busyId === vehicle.id}
                    aria-label={`Remove ${vehicle.label}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
