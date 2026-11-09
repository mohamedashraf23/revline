import Link from "next/link";

import { categoryIcon } from "@/components/icons";
import { ProductCard } from "@/components/ProductCard";
import { VehicleFinder } from "@/components/VehicleFinder";
import { getBestSellers, getCategories, getVehicleOptions } from "@/lib/api";
import { getServerCart } from "@/lib/server-cart";

export const dynamic = "force-dynamic";

const TRUST_BADGES = [
  { title: "Fitment Guaranteed", sub: "Or your money back" },
  { title: "Ships Fast", sub: "1–2 business days" },
  { title: "Real Humans on the Phone", sub: "Mon–Sat support" },
  { title: "Easy 30-Day Returns", sub: "No hassle" },
];

export default async function HomePage() {
  const cart = await getServerCart();
  const vehicle = cart?.vehicle ?? null;

  const [categories, bestSellers, vehicleOptions] = await Promise.all([
    getCategories(),
    // With a vehicle saved, the rail is parts that actually fit it.
    getBestSellers({ limit: 4, cart_id: cart?.id }),
    getVehicleOptions(),
  ]);

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">PARTS THAT FIT, GEAR THAT PERFORMS</div>
          <h1 className="hero__title">
            Everything for the garage, from daily driver to weekend build.
          </h1>
          <p className="hero__lede">
            OEM replacement parts and performance upgrades, backed by a fitment guarantee and people
            who actually know cars.
          </p>
          <VehicleFinder options={vehicleOptions} />
        </div>
        <div className="hero__art">
          <div className="photo-note">hero photo — car on lift in garage</div>
        </div>
      </section>

      <section className="promo">
        Free shipping on orders over $75
        <span className="promo__dot">·</span>
        {vehicleOptions.model_count.toLocaleString()} vehicles in the fitment database
        <span className="promo__dot">·</span>
        Fitment Guaranteed or your money back
      </section>

      <section className="section">
        <h2 className="h2">Shop by category</h2>
        <div className="category-grid">
          {categories.map((category) => {
            const Icon = categoryIcon(category.id);
            return (
              <Link
                key={category.id}
                href={`/shop?category=${encodeURIComponent(category.id)}`}
                className="category-card"
              >
                <Icon size={32} className="category-card__icon" />
                <div className="category-card__name">{category.name}</div>
                <div className="category-card__count">{category.product_count} parts</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="section section--tight">
        <div className="rail-head">
          <h2 className="h2 h2--rail">
            {vehicle ? `Popular for your ${vehicle.label}` : "Best sellers"}
          </h2>
          <Link href={vehicle ? "/shop?fits=1" : "/shop"} className="rail-head__link">
            View all →
          </Link>
        </div>
        <div className="product-grid product-grid--4">
          {bestSellers.results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="trust">
        <div className="trust__grid">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title} className="trust__item">
              <div className="trust__icon" aria-hidden>
                ✓
              </div>
              <div>
                <div className="trust__title">{badge.title}</div>
                <div className="trust__sub">{badge.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
