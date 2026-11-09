"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import * as api from "@/lib/api";
import type { ProductSummary } from "@/lib/types";

/**
 * Header search with instant part suggestions, backed by the SQLite FTS5 index.
 *
 * Suggestions are a preview, not the destination — Enter always goes to /shop
 * with the query in the URL, so a search is shareable and the full result set
 * stays filterable.
 */
export function SearchBox() {
  const router = useRouter();
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProductSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setHits([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .getProducts({ search: needle, page_size: 6, with_facets: false })
        .then((list) => setHits(list.results))
        .catch(() => setHits([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  function submit(target?: ProductSummary) {
    setOpen(false);
    setHighlight(-1);
    if (target) {
      router.push(`/product/${target.slug}`);
      return;
    }
    const needle = query.trim();
    if (needle) router.push(`/shop?search=${encodeURIComponent(needle)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(highlight >= 0 ? hits[highlight] : undefined);
    } else if (event.key === "ArrowDown" && hits.length) {
      event.preventDefault();
      setOpen(true);
      setHighlight((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp" && hits.length) {
      event.preventDefault();
      setHighlight((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div className="search">
      <input
        className="search__input"
        type="search"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={highlight >= 0 ? `${listboxId}-${highlight}` : undefined}
        aria-label="Search parts"
        placeholder="Search parts, brands or SKUs"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />

      {open && hits.length > 0 && (
        <ul className="search__list" id={listboxId} role="listbox" aria-label="Part suggestions">
          {hits.map((hit, index) => (
            <li
              key={hit.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === highlight}
              className={`search__option${index === highlight ? " search__option--active" : ""}`}
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                submit(hit);
              }}
              onMouseEnter={() => setHighlight(index)}
            >
              <span className="search__name">{hit.name}</span>
              <span className="search__meta">
                {hit.category} · {api.money(hit.price)}
              </span>
            </li>
          ))}
          <li className="search__all" role="option" aria-selected={false}>
            <button
              type="button"
              onMouseDown={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                submit();
              }}
            >
              See all results for “{query.trim()}” →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
