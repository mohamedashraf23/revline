import Link from "next/link";

import { AccountOrders } from "@/components/AccountOrders";
import { GaragePanel } from "@/components/GaragePanel";
import { getVehicleOptions } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My garage — Revline",
  description: "Your saved vehicles and order history.",
};

/**
 * Garage and order history. The garage works signed out (it hangs off the
 * guest cart), so this page is not behind an auth gate — only the order list
 * is, and it says so itself.
 */
export default async function AccountPage() {
  const options = await getVehicleOptions();

  return (
    <div className="page">
      <div className="crumbs">
        <Link href="/">Home</Link> / My garage
      </div>
      <h1 className="page-title">My garage</h1>

      <GaragePanel options={options} />
      <AccountOrders />
    </div>
  );
}
