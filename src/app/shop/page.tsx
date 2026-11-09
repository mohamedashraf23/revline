import Link from "next/link";

import { ChangeVehicleButton } from "@/components/ChangeVehicleButton";
import { FacetLink } from "@/components/FacetLink";
import { ProductCard } from "@/components/ProductCard";
import { Pagination } from "@/components/Pagination";
import { SortSelect } from "@/components/ShopControls";
import { getCategories, getProducts } from "@/lib/api";
import { getServerCart } from "@/lib/server-cart";
import type { SortKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop parts — Revline",
  description: "Browse OEM replacement parts and performance upgrades by category and type.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const PART_TYPES = [
  { value: "all", label: "All" },
  { value: "OEM", label: "OEM Replacement" },
  { value: "Performance", label: "Performance" },
];

const SORTS: SortKey[] = ["relevance", "popular", "price-asc", "price-desc", "rating", "newest"];

/** Keys that survive a facet click, so filters compose instead of resetting. */
const CARRIED = ["category", "type", "badge", "brand", "search", "fits", "stock", "sort"];

function buildHref(current: SearchParams, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const key of CARRIED) {
    const value = first(current[key]);
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
  }
  // Any filter change invalidates the page number.
  params.delete("page");
  const query = params.toString();
  return query ? `/shop?${query}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const category = first(params.category) ?? "all";
  const type = first(params.type) ?? "all";
  const badge = first(params.badge);
  const brand = first(params.brand);
  const search = first(params.search);
  const fitsOnly = first(params.fits) === "1";
  const inStock = first(params.stock) === "1";
  const rawSort = first(params.sort) as SortKey | undefined;
  const sort: SortKey = rawSort && SORTS.includes(rawSort) ? rawSort : "relevance";
  const page = Math.max(1, Number(first(params.page) ?? 1) || 1);

  const [categories, cart] = await Promise.all([getCategories(), getServerCart()]);
  const vehicle = cart?.vehicle ?? null;

  const products = await getProducts({
    category,
    type: type === "all" ? undefined : type,
    badge,
    brand,
    search,
    in_stock: inStock || undefined,
    // `fits_only` without a vehicle is a 422, so only send it when we have one.
    fits_only: fitsOnly && Boolean(vehicle),
    cart_id: cart?.id,
    sort,
    page,
    page_size: 24,
  });

  const title = search
    ? `Results for “${search}”`
    : badge === "Sale"
      ? "Deals"
      : category === "all"
        ? "Shop All Parts"
        : category;

  const pageHref = (n: number) => {
    const query = new URLSearchParams();
    for (const key of CARRIED) {
      const value = first(params[key]);
      if (value) query.set(key, value);
    }
    if (n > 1) query.set("page", String(n));
    const qs = query.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <div className="page">
      <div className="crumbs">
        <Link href="/">Home</Link> / {title}
      </div>
      <h1 className="page-title">{title}</h1>

      {vehicle ? (
        <div className="notice notice--info">
          <div>
            {fitsOnly ? "Showing parts that fit your " : "Saved vehicle: "}
            <strong>{vehicle.label}</strong>
          </div>
          <div className="notice__actions">
            {fitsOnly ? (
              <Link href={buildHref(params, { fits: undefined })} className="notice__action">
                Show all parts
              </Link>
            ) : (
              <Link href={buildHref(params, { fits: "1" })} className="notice__action">
                Only show parts that fit
              </Link>
            )}
            <ChangeVehicleButton />
          </div>
        </div>
      ) : (
        <div className="notice notice--info">
          <div>No vehicle selected, so fitment is not being checked.</div>
          <div className="notice__actions">
            <Link href="/" className="notice__action">
              Add your vehicle
            </Link>
          </div>
        </div>
      )}

      <div className="shop-layout">
        <aside>
          <div className="facet__title">Category</div>
          <div className="facet__list">
            <FacetLink
              label="All Parts"
              href={buildHref(params, { category: undefined })}
              active={category === "all"}
            />
            {categories.map((c) => (
              <FacetLink
                key={c.id}
                label={`${c.name} (${c.product_count})`}
                href={buildHref(params, { category: c.id })}
                active={category === c.id}
              />
            ))}
          </div>

          <div className="facet__title">Type</div>
          <div className="facet__list">
            {PART_TYPES.map((t) => (
              <FacetLink
                key={t.value}
                label={
                  t.value === "all"
                    ? t.label
                    : `${t.label} (${
                        products.facets?.types.find((f) => f.value === t.value)?.count ?? 0
                      })`
                }
                href={buildHref(params, { type: t.value })}
                active={type === t.value}
              />
            ))}
          </div>

          <div className="facet__title">Availability</div>
          <div className="facet__list">
            <FacetLink
              label="All"
              href={buildHref(params, { stock: undefined })}
              active={!inStock}
            />
            <FacetLink
              label="In stock only"
              href={buildHref(params, { stock: "1" })}
              active={inStock}
            />
          </div>

          {products.facets && products.facets.brands.length > 1 && (
            <>
              <div className="facet__title">Brand</div>
              <div className="facet__list">
                <FacetLink
                  label="All brands"
                  href={buildHref(params, { brand: undefined })}
                  active={!brand}
                />
                {products.facets.brands.slice(0, 12).map((f) => (
                  <FacetLink
                    key={f.value}
                    label={`${f.label} (${f.count})`}
                    href={buildHref(params, { brand: f.value })}
                    active={brand === f.value}
                  />
                ))}
              </div>
            </>
          )}
        </aside>

        <div>
          <div className="shop-bar">
            <div className="result-count">
              {products.total.toLocaleString()} {products.total === 1 ? "result" : "results"}
              {products.pages > 1 && (
                <span className="result-count__page">
                  {" "}
                  · page {products.page} of {products.pages}
                </span>
              )}
            </div>
            <SortSelect value={sort} />
          </div>

          {products.total === 0 ? (
            <div className="empty">
              <div className="empty__text">
                {search
                  ? `Nothing matched “${search}”.`
                  : fitsOnly && vehicle
                    ? `No parts in this category are listed for your ${vehicle.label} yet.`
                    : "No parts match these filters."}
              </div>
              <Link href="/shop" className="btn btn--sm">
                Clear filters
              </Link>
            </div>
          ) : (
            <>
              <div className="product-grid product-grid--3">
                {products.results.map((product) => (
                  <ProductCard key={product.id} product={product} size="sm" />
                ))}
              </div>
              <Pagination page={products.page} pages={products.pages} makeHref={pageHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
