import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/AddToCart";
import { PartArt } from "@/components/PartArt";
import { ProductCard } from "@/components/ProductCard";
import { ProductTabs } from "@/components/ProductTabs";
import { Stars } from "@/components/Stars";
import { ApiError, getProduct, getRelatedProducts, money } from "@/lib/api";
import { getServerCart } from "@/lib/server-cart";
import type { ProductDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

/** `slug` is whatever the API accepts as a key: the URL slug, the id or the SKU. */
async function loadProduct(slug: string, cartId?: string) {
  try {
    return await getProduct(slug, { cart_id: cartId });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return { title: `${product.name} — Revline`, description: product.description };
  } catch {
    return { title: "Part not found — Revline" };
  }
}

/**
 * The fitment banner is the most important thing on this page, so it gets all
 * four states in full prose rather than a pill.
 */
function FitmentBanner({
  product,
  vehicleLabel,
}: {
  product: ProductDetail;
  vehicleLabel: string | null;
}) {
  if (!vehicleLabel) {
    return (
      <Link href="/" className="fitment fitment--unknown">
        Add your vehicle to confirm fitment →
      </Link>
    );
  }

  switch (product.fits_vehicle) {
    case "universal":
      return <div className="fitment fitment--yes">✓ Universal fit — works on your {vehicleLabel}</div>;
    case "fits":
      return <div className="fitment fitment--yes">✓ Fits your {vehicleLabel}</div>;
    case "partial":
      return (
        <div className="fitment fitment--partial">
          Right part for your {vehicleLabel.split(" ").slice(1).join(" ")}, but not for that model
          year. {product.fitment_note}.
        </div>
      );
    default:
      return (
        <div className="fitment fitment--no">
          Not listed as a fit for your {vehicleLabel}. {product.fitment_note}.
        </div>
      );
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cart = await getServerCart();
  const vehicle = cart?.vehicle ?? null;

  const [product, related] = await Promise.all([
    loadProduct(slug, cart?.id),
    getRelatedProducts(slug, { limit: 4, cart_id: cart?.id }),
  ]);

  const onSale = product.compare_at_price !== null && product.compare_at_price > product.price;
  const saving = onSale ? product.compare_at_price! - product.price : 0;

  return (
    <div className="page page--product">
      <div className="crumbs">
        <Link href="/">Home</Link> /{" "}
        <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
          {product.category}
        </Link>{" "}
        / {product.name}
      </div>

      <div className="product-layout">
        <div>
          <div className="gallery__main">
            <PartArt sku={product.sku} category={product.category} className="gallery__svg" />
          </div>
          <div className="gallery__thumbs">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="gallery__thumb">
                <PartArt
                  sku={`${product.sku}-${n}`}
                  category={product.category}
                  className="gallery__svg"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="product__meta">
            {product.category} · {product.type} · {product.brand}
          </div>
          <h1 className="product__title">{product.name}</h1>

          <div className="product__rating">
            <Stars rating={product.rating} size={16} />
            <span>
              {product.rating.toFixed(1)} ({product.review_count.toLocaleString()} reviews)
            </span>
          </div>

          <div className="product__price-row">
            <div className="product__price">{money(product.price)}</div>
            {onSale && (
              <>
                <div className="product__was">{money(product.compare_at_price!)}</div>
                <div className="product__saving">Save {money(saving)}</div>
              </>
            )}
          </div>

          <div className="product__sku">SKU {product.sku}</div>
          <p className="product__desc">{product.description}</p>

          <FitmentBanner product={product} vehicleLabel={vehicle?.label ?? null} />

          <AddToCart
            productId={product.id}
            inStock={product.in_stock}
            stockQuantity={product.stock_quantity}
          />

          <div className="stock-note">
            {product.in_stock
              ? product.stock_quantity <= 10
                ? `Only ${product.stock_quantity} left · Ships within 1–2 business days`
                : "In stock · Ships within 1–2 business days"
              : "Currently unavailable"}
          </div>

          <ProductTabs product={product} />
        </div>
      </div>

      <h2 className="h3">You might also need</h2>
      <div className="product-grid product-grid--4">
        {related.results.map((item) => (
          <ProductCard key={item.id} product={item} size="xs" compact />
        ))}
      </div>
    </div>
  );
}
