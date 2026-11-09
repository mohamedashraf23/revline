"use client";

import { useState } from "react";

import type { ProductDetail } from "@/lib/types";

import { Stars } from "./Stars";

type Tab = "specs" | "fitment" | "reviews";

export function ProductTabs({ product }: { product: ProductDetail }) {
  const [tab, setTab] = useState<Tab>("specs");

  // Model-level rules read as one line each; make-level rules are collapsed to
  // a marque list, because 33 near-identical rows is not a fitment table.
  const modelRules = product.fitment_ranges.filter((r) => r.model !== null);
  const makeRules = product.fitment_ranges.filter((r) => r.model === null);

  const tabs: { key: Tab; label: string }[] = [
    { key: "specs", label: "Specs" },
    { key: "fitment", label: "Fitment" },
    { key: "reviews", label: `Reviews (${product.reviews.length})` },
  ];

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tabs__tab${tab === t.key ? " tabs__tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "specs" && (
        <div className="tabs__panel" role="tabpanel">
          <dl className="spec-list">
            <dt>SKU</dt>
            <dd>{product.sku}</dd>
            <dt>Brand</dt>
            <dd>{product.brand}</dd>
            <dt>Part type</dt>
            <dd>{product.type === "OEM" ? "OEM replacement" : "Performance"}</dd>
            <dt>Category</dt>
            <dd>{product.category}</dd>
            <dt>Shipping weight</dt>
            <dd>{(product.weight_grams / 1000).toFixed(2)} kg</dd>
            <dt>Warranty</dt>
            <dd>{product.warranty}</dd>
            <dt>Availability</dt>
            <dd>
              {product.in_stock ? `${product.stock_quantity} in stock` : "Out of stock"}
            </dd>
          </dl>
        </div>
      )}

      {tab === "fitment" && (
        <div className="tabs__panel" role="tabpanel">
          {product.universal_fit ? (
            <p>
              <strong>Universal fit.</strong> This part is not vehicle-specific — it works with any
              make and model.
            </p>
          ) : (
            <>
              {modelRules.length > 0 && (
                <table className="fit-table">
                  <caption>Confirmed vehicle fitment</caption>
                  <thead>
                    <tr>
                      <th scope="col">Make</th>
                      <th scope="col">Model</th>
                      <th scope="col">Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelRules.map((rule) => (
                      <tr key={`${rule.make}-${rule.model}-${rule.year_min}`}>
                        <td>{rule.make}</td>
                        <td>{rule.model}</td>
                        <td>
                          {rule.year_min}–{rule.year_max}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {makeRules.length > 0 && (
                <>
                  <p className="fit-makes__intro">
                    Covers {makeRules.length} {makeRules.length === 1 ? "marque" : "marques"}:
                  </p>
                  <ul className="fit-makes">
                    {makeRules.map((rule) => (
                      <li key={`${rule.make}-${rule.year_min}`}>
                        <strong>{rule.make}</strong> {rule.year_min}–{rule.year_max}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {product.fitment_ranges.length === 0 && (
                <p>No fitment data recorded for this part yet — check before ordering.</p>
              )}

              <p className="fit-note">
                Year coverage is derived from the source vehicle dataset, which has no year column.
                Confirm against your VIN before ordering a vehicle-specific part.
              </p>
            </>
          )}
        </div>
      )}

      {tab === "reviews" && (
        <div className="tabs__panel" role="tabpanel">
          {product.reviews.length === 0 ? (
            <p>No written reviews yet — be the first to review this part.</p>
          ) : (
            <ul className="reviews">
              {product.reviews.map((review, index) => (
                <li key={`${review.author}-${index}`} className="review">
                  <div className="review__head">
                    <Stars rating={review.rating} />
                    <span className="review__author">{review.author}</span>
                    {review.vehicle_label && (
                      <span className="review__vehicle">{review.vehicle_label}</span>
                    )}
                  </div>
                  <p className="review__body">{review.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
