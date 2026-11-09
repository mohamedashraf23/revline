import Link from "next/link";

import { money } from "@/lib/api";
import type { ProductSummary } from "@/lib/types";

import { FitBadge } from "./FitBadge";
import { PartArt } from "./PartArt";
import { Stars } from "./Stars";

type Size = "default" | "sm" | "xs";

const ART_CLASS: Record<Size, string> = {
  default: "product-card__art",
  sm: "product-card__art product-card__art--sm",
  xs: "product-card__art product-card__art--xs",
};

export function ProductCard({
  product,
  size = "default",
  compact = false,
}: {
  product: ProductSummary;
  size?: Size;
  compact?: boolean;
}) {
  const onSale = product.compare_at_price !== null && product.compare_at_price > product.price;

  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className={ART_CLASS[size]}>
        <PartArt sku={product.sku} category={product.category} className="product-card__svg" />
        {product.badge && <div className="badge">{product.badge}</div>}
        {!product.in_stock && <div className="badge badge--muted">Out of stock</div>}
      </div>

      <div className={`product-card__body${compact ? " product-card__body--compact" : ""}`}>
        {!compact && <div className="product-card__category">{product.category}</div>}
        <div className="product-card__name">{product.name}</div>

        {!compact && (
          <div className="product-card__meta">
            <Stars rating={product.rating} />
            <span className="product-card__reviews">({product.review_count})</span>
          </div>
        )}

        <div className="product-card__price-row">
          <span className="product-card__price">{money(product.price)}</span>
          {onSale && (
            <span className="product-card__was">{money(product.compare_at_price!)}</span>
          )}
        </div>

        {/* Renders nothing when no vehicle is selected — see FitBadge. */}
        <FitBadge status={product.fits_vehicle} compact />
      </div>
    </Link>
  );
}
