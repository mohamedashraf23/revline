"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { SortKey } from "@/lib/types";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Relevance",
  popular: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Highest rated",
  newest: "Newest",
};

/**
 * Sort is a <select> that writes to the URL rather than local state, so it
 * composes with the facet links and survives a reload or a shared link.
 *
 * Pagination is a sibling but a *server* component — see Pagination.tsx.
 */
export function SortSelect({ value }: { value: SortKey }) {
  const router = useRouter();
  const params = useSearchParams();

  function change(next: string) {
    const query = new URLSearchParams(params.toString());
    query.set("sort", next);
    query.delete("page"); // a new ordering invalidates the page number
    router.push(`/shop?${query.toString()}`);
  }

  return (
    <label className="sort">
      <span className="sort__label">Sort</span>
      <select
        className="field field--sm"
        value={value}
        onChange={(e) => change(e.target.value)}
        aria-label="Sort results"
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
    </label>
  );
}
