"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import * as api from "@/lib/api";
import type { ModelSearchHit, VehicleModel, VehicleOptions } from "@/lib/types";

import { useCart } from "./CartProvider";

/**
 * Year → Make → Model, plus a type-ahead that skips the cascade.
 *
 * With 1,193 nameplates a <select> of models is unusable, so Model is a
 * combobox: typing queries the API, and the dropdown is a listbox with full
 * keyboard support. The cascade stays for people who would rather browse —
 * picking a Year filters the model list to what was sold that year, which the
 * API does from the (derived) production window on each model.
 */
export function VehicleFinder({
  options,
  compact = false,
  onDone,
}: {
  options: VehicleOptions;
  compact?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { cart, selectVehicle } = useCart();
  const listboxId = useId();

  const [year, setYear] = useState<string>(cart?.vehicle?.year ? String(cart.vehicle.year) : "");
  const [makeSlug, setMakeSlug] = useState(cart?.vehicle?.make_slug ?? "");
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [modelSlug, setModelSlug] = useState(cart?.vehicle?.model_slug ?? "");

  const [query, setQuery] = useState(cart?.vehicle?.model ?? "");
  const [hits, setHits] = useState<ModelSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Model list for the chosen make, narrowed by year when one is picked.
  useEffect(() => {
    if (!makeSlug) {
      setModels([]);
      return;
    }
    let cancelled = false;
    api
      .getModelsForMake(makeSlug, year ? Number(year) : undefined)
      .then((rows) => {
        if (!cancelled) setModels(rows);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [makeSlug, year]);

  // Debounced type-ahead. Scoped to the selected make when there is one.
  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setHits([]);
      return;
    }

    const handle = setTimeout(() => {
      const scoped = makeSlug
        ? `${options.makes.find((m) => m.slug === makeSlug)?.name ?? ""} ${needle}`
        : needle;
      api
        .searchModels(scoped.trim(), { limit: 10, year: year ? Number(year) : undefined })
        .then(setHits)
        .catch(() => setHits([]));
    }, 180);

    return () => clearTimeout(handle);
  }, [query, makeSlug, year, options.makes]);

  const choose = useCallback(
    (hit: { make_slug: string; slug: string; name: string; make: string }) => {
      setMakeSlug(hit.make_slug);
      setModelSlug(hit.slug);
      setQuery(hit.name);
      setOpen(false);
      setHighlight(-1);
      setError(null);
    },
    [],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || hits.length === 0) {
      if (event.key === "ArrowDown" && hits.length) setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((i) => (i + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (event.key === "Enter" && highlight >= 0) {
      event.preventDefault();
      choose(hits[highlight]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setHighlight(-1);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Resolve a typed-but-unpicked model against the loaded list, so pressing
    // Enter straight after typing "M5 CS" still works.
    let slug = modelSlug;
    if (!slug && query.trim()) {
      const typed = query.trim().toLowerCase();
      slug =
        models.find((m) => m.name.toLowerCase() === typed)?.slug ??
        hits.find((h) => h.name.toLowerCase() === typed)?.slug ??
        hits[0]?.slug ??
        "";
      if (!makeSlug && hits[0]) setMakeSlug(hits[0].make_slug);
    }

    const resolvedMake = makeSlug || hits.find((h) => h.slug === slug)?.make_slug || "";

    if (!year || !resolvedMake || !slug) {
      setError("Pick a year, make and model to check fitment.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await selectVehicle({ year: Number(year), make_slug: resolvedMake, model_slug: slug });
      onDone?.();
      // Server components read the vehicle from the cart cookie.
      router.refresh();
      router.push("/shop?fits=1");
    } catch (err) {
      setError(
        err instanceof api.ApiError ? err.message : "Could not save your vehicle. Is the API running?",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeMake = options.makes.find((m) => m.slug === makeSlug);

  return (
    <form className={`finder${compact ? " finder--compact" : ""}`} onSubmit={handleSubmit}>
      {!compact && <div className="finder__title">Find parts for your vehicle</div>}

      <div className="finder__row">
        <select
          className="field"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Year"
        >
          <option value="">Year</option>
          {options.years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={makeSlug}
          onChange={(e) => {
            setMakeSlug(e.target.value);
            setModelSlug("");
            setQuery("");
          }}
          aria-label="Make"
        >
          <option value="">Make</option>
          {options.makes.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>

        <div className="combo">
          <input
            className="field"
            role="combobox"
            aria-expanded={open && hits.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={highlight >= 0 ? `${listboxId}-${highlight}` : undefined}
            value={query}
            placeholder={activeMake ? `Model (${activeMake.model_count})` : "Model — or search"}
            aria-label="Model"
            onChange={(e) => {
              setQuery(e.target.value);
              setModelSlug("");
              setOpen(true);
              setHighlight(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              // Let a click on an option land before the list unmounts.
              blurTimer.current = setTimeout(() => setOpen(false), 120);
            }}
            onKeyDown={onKeyDown}
          />

          {open && hits.length > 0 && (
            <ul className="combo__list" id={listboxId} role="listbox" aria-label="Matching vehicles">
              {hits.map((hit, index) => (
                <li
                  key={hit.slug}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={index === highlight}
                  className={`combo__option${index === highlight ? " combo__option--active" : ""}`}
                  onMouseDown={() => {
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    choose(hit);
                  }}
                  onMouseEnter={() => setHighlight(index)}
                >
                  <span className="combo__label">{hit.label}</span>
                  <span className="combo__meta">
                    {hit.year_start}–{hit.year_end} · {hit.body_style}
                    {hit.powertrain !== "ice" ? ` · ${hit.powertrain.toUpperCase()}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Browsing path: once a make is chosen, offer its models as a plain list. */}
      {makeSlug && !query && models.length > 0 && (
        <select
          className="field finder__models"
          value={modelSlug}
          onChange={(e) => {
            const slug = e.target.value;
            setModelSlug(slug);
            setQuery(models.find((m) => m.slug === slug)?.name ?? "");
          }}
          aria-label={`${activeMake?.name ?? ""} models`}
        >
          <option value="">
            {year ? `All ${models.length} models sold in ${year}` : `All ${models.length} models`}
          </option>
          {models.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name} ({m.year_start}–{m.year_end})
            </option>
          ))}
        </select>
      )}

      {error && <div className="finder__error">{error}</div>}

      <button type="submit" className="btn btn--block" disabled={saving}>
        {saving ? "Checking fitment…" : "Find Parts"}
      </button>

      {!compact && (
        <p className="finder__foot">
          {options.model_count.toLocaleString()} models across {options.makes.length} makes.
        </p>
      )}
    </form>
  );
}
