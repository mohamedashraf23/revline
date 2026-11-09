"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "./CartProvider";

export function ChangeVehicleButton() {
  const router = useRouter();
  const { clearVehicle } = useCart();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await clearVehicle();
      // Server components read the vehicle from the cart cookie, so refresh them.
      router.refresh();
      router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="notice__action" onClick={handleClick} disabled={busy}>
      Change
    </button>
  );
}
