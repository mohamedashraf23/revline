# Revline Auto Parts

A full-stack auto-parts storefront: a **Next.js 15** frontend (App Router, TypeScript, React 19)
on a **Python FastAPI** backend with SQLAlchemy, Alembic and SQLite.

The thing that makes it an auto-parts store rather than a generic shop is **fitment** — and that
runs on a real vehicle reference built from a 1,218-row cars dataset: **34 marques, 1,193
nameplates, 1,165 of them road cars**. The shopper picks their actual car, and the catalogue
answers for every part whether it fits, why it does not, or that it fits anything.

```
Revline/
├── backend/              FastAPI service
│   ├── app/
│   │   ├── main.py       app factory, middleware order, startup
│   │   ├── config.py     settings (env / backend/.env)
│   │   ├── database.py   engine + SQLite pragmas
│   │   ├── models.py     SQLAlchemy models
│   │   ├── schemas.py    Pydantic request/response models
│   │   ├── services.py   pricing, fitment resolution, serialization
│   │   ├── search.py     SQLite FTS5 index and querying
│   │   ├── security.py   scrypt password hashing, JWT
│   │   ├── deps.py       db session, current user, cart ownership
│   │   ├── middleware.py request ids, JSON logs, rate limit, error envelope
│   │   ├── migrate.py    runs Alembic on startup
│   │   ├── catalog_spec.py  part templates the generator expands
│   │   ├── seed.py       deterministic catalogue + vehicle seeding
│   │   ├── data/vehicles.json   committed, cleaned vehicle reference
│   │   └── routers/      catalog · vehicles · auth · garage · cart · orders
│   ├── migrations/       Alembic
│   ├── scripts/          import_vehicles.py + taxonomy.py (the ETL)
│   ├── data/raw/         the source CSV
│   └── tests/            128 pytest tests
└── frontend/
    ├── src/app/          / · /shop · /product/[slug] · /cart · /checkout
    │                     /order/[n] · /account · /signin
    ├── src/components/   VehicleFinder, GaragePanel, SearchBox, PartArt, …
    ├── src/lib/          typed API client, shared types
    └── e2e/              19 Playwright tests
```

## Running it

Two terminals. **Backend first** — the frontend renders pages from its data.

```bash
cd backend && python -m venv .venv && .venv/Scripts/python.exe -m pip install -r requirements.txt && .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

- Storefront → http://localhost:3000
- API docs (Swagger) → http://localhost:8000/docs

On macOS/Linux the venv binary is `.venv/bin/python` instead of `.venv/Scripts/python.exe`.

The database is created, migrated and seeded on first boot. Seeding builds 859 SKUs and the full
vehicle reference in about a second. **To reset it**, stop the API and delete `backend/revline.db*`
— it will rebuild identically, because the generator is deterministic.

A demo account is seeded with a two-car garage:

```
demo@revline.dev / revline-demo-2026
```

## The vehicle data

`backend/data/raw/cars_2025.csv` has exactly two columns — `Company Names` and `Cars Names` — and
it is dirty. `scripts/import_vehicles.py` turns it into `app/data/vehicles.json`, which is
committed so the API never needs the CSV:

```bash
cd backend && python -I scripts/import_vehicles.py
```

What that pass fixes, with every decision reviewable in `scripts/taxonomy.py`:

| Problem in the source | What the importer does |
| --- | --- |
| `"ROLLS ROYCE "`, `"KIA  "` — trailing-space keys | Whitespace collapsed, so they merge |
| `NISSAN` / `Nissan`, `KIA` / `Kia` | Case-folded to one marque each |
| `Jaguar Land Rover` — two marques in one cell | Split by model prefix |
| `BMW,Mclaren 720s` | Reassigned to McLaren |
| `Nissan,Infiniti QX80*` | Reassigned to Infiniti, asterisk dropped |
| `MERCEDES,BENZ S-CLASS S 580` | Redundant marque prefix stripped |
| `SPORTAGE 2024(SX TURBO AWD)` ×11 | Mapped to readable trim names |
| `Proteg\xe9` read as UTF-8 | Decoded as Windows-1252 → `Protegé` |
| 25 duplicate make+model rows | Deduplicated |
| `FERRARI,SF90 STRADALE` vs `Porsche,911 Carrera` | Cased consistently, acronyms preserved |
| Volvo FH16 lorries, Mazda 787B race car | Kept, flagged `road_legal: false`, hidden from the picker |

**What is derived, and therefore not fact.** The source has no years, prices, body styles or
engines. `year_start`, `year_end`, `body_style`, `powertrain` and `is_performance` are inferred
from the model name by the importer. They are deterministic — hashed off the name, so every run
produces byte-identical output — but they are catalogue scaffolding, not manufacturer data. The
JSON records this under `derived_fields`, `GET /api/vehicles/options` returns it, and the product
page says so under the fitment table. Do not quote those years as real.

## How the pieces fit

**The backend owns the rules.** Prices, line totals, the $75 free-shipping threshold, the 7% tax
estimate, stock and fitment are all computed in Python. The frontend never recalculates a total —
it renders what the API returns, so the number on the cart page and the number on the order are
the same number.

**Fitment has four states, not two.** `GET /api/products/{key}` returns `fits_vehicle` as one of:

| State | Meaning |
| --- | --- |
| `null` | No vehicle selected, so fitment was **not evaluated** — different from "does not fit" |
| `"universal"` | The part is not vehicle-specific (fluids, bulbs, wipers, tools) |
| `"fits"` | A rule covers this make/model **and** this model year |
| `"partial"` | Right part for the car, **wrong year** — so the shopper knows why |
| `"no"` | Nothing covers it |

Rules live in `fitments` at one of three precisions: a nameplate (`model_id` set), a whole marque
(`model_id` null), or none at all plus `universal_fit`. `fitting_product_ids()` resolves the whole
catalogue against a vehicle in one query, so `?fits_only=1` filters in SQL rather than in Python.

**The catalogue is generated, not hand-written.** `catalog_spec.py` describes ~50 *kinds* of part
and how to multiply each one out — universal, once per marque, or once per nameplate. `seed.py`
expands that against the real vehicle data into **859 SKUs across 13 categories**, pricing each by
marque tier, so a Rolls-Royce brake kit costs what a Rolls-Royce brake kit should. Every value
(price, stock, rating, sale flag, coverage window) comes from a SHA-256 of the SKU rather than an
RNG, so two machines get identical catalogues and the tests can assert on real numbers.

**Search is real full-text search.** SQLite FTS5 with porter stemming and BM25, weighted so a name
hit outranks a description hit. `brake` and `brakes` return the same set; `coilov` matches as you
type. User input is tokenised rather than passed through, because FTS5 `MATCH` is its own query
language and a stray quote would otherwise be a syntax error (and a 500).

**Carts are server-side; the garage is not just one car.** The browser keeps only a cart id
(localStorage + a `revline_cart` cookie). Because the id is a cookie, server components resolve
the shopper's vehicle during SSR — which is why `/shop` and `/product/[slug]` render fitment with
no client round trip. A garage belongs to the account when signed in and to the guest cart
otherwise, so someone can save three cars before registering and **keep all of them, plus their
basket, when they do** — signing in at checkout never empties the cart.

**Filters live in the URL.** `/shop?category=Brakes&type=Performance&brand=ApexFlow&sort=price-asc&fits=1&page=2`
is shareable and back-button friendly. Facets are server-rendered links with counts computed over
the *filtered* set, so the number next to a facet is what clicking it returns.

**Product imagery is generated.** There is no photography for 859 SKUs, and eight identical grey
placeholders in a row makes a grid unreadable. `PartArt` derives a hue and a category-appropriate
motif from the SKU, so every part looks like itself, the same part always looks the same, and
there is no hydration mismatch and no network request.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | liveness, version, environment |
| GET | `/api/categories` | categories with product counts (ETagged) |
| GET | `/api/products` | filter, search, facet, sort, paginate |
| GET | `/api/products/best-sellers` | home rail; prefers parts that fit |
| GET | `/api/products/{key}` | detail by id, slug or SKU |
| GET | `/api/products/{key}/related` | "You might also need" |
| GET | `/api/vehicles/options` | years + marques + model count (ETagged) |
| GET | `/api/vehicles/makes/{slug}/models` | models, optionally narrowed by year |
| GET | `/api/vehicles/search` | type-ahead across all 1,165 road models |
| POST | `/api/auth/register` · `/login` | JWT; claims the guest cart |
| GET | `/api/auth/me` · `/me/orders` | account + order history |
| GET/POST | `/api/garage` | saved vehicles (account or guest cart) |
| DELETE | `/api/garage/{id}` | remove a saved vehicle |
| POST | `/api/carts` | create a cart |
| GET | `/api/carts/{id}` | cart with server-computed totals |
| POST | `/api/carts/{id}/items` | add (merges quantities, checks stock) |
| PATCH/DELETE | `/api/carts/{id}/items/{productId}` | set quantity / remove |
| PUT/DELETE | `/api/carts/{id}/vehicle` | select / clear the active vehicle |
| POST | `/api/orders` | place an order, decrement stock, empty the cart |
| GET | `/api/orders/{orderNumber}` | confirmation page data |

Every error shares one shape, so clients branch on a stable code rather than parsing prose:

```json
{"error": {"code": "conflict", "message": "Only 3 left in stock",
           "detail": null, "request_id": "b85f0d1a1a61429e"}}
```

That `request_id` is on every response as `X-Request-ID` and in every JSON log line, so a
screenshot of a failed checkout is enough to find the request.

## Tests

```bash
cd backend && .venv/Scripts/python.exe -m pip install -r requirements-dev.txt && .venv/Scripts/python.exe -m pytest
```

```bash
cd frontend && npm run typecheck && npm run build
```

```bash
cd frontend && npx playwright install chromium && npm run test:e2e
```

**128 pytest tests** cover the ETL output (marque merges, reassignments, deduplication, encoding,
reproducibility), all four fitment states, faceted search, FTS5 behaviour including metacharacters
in user input, password hashing, cart claiming and ownership, stock, checkout, and the error
envelope.

**19 Playwright tests** drive the real stack end to end — Playwright starts its own API on 8111
and web server on 3111 with a separate database, so a `npm run dev` on the usual ports is left
alone. The suite covers the type-ahead, the year-narrowed cascade, fits-only filtering, guest
checkout, sign-up carrying the guest cart and garage across, and garage switching.

> The e2e web server runs `next dev` rather than `build && start`. This project lives under
> OneDrive, where `next build` intermittently dies with `EINVAL readlink` on `.next/diagnostics`
> after OneDrive turns a build artefact into a cloud placeholder. `npm run build` is verified
> separately by the command above; if it fails that way, `rm -rf frontend/.next` and retry.

## Configuration

`backend/.env` (all optional):

```
DATABASE_URL=sqlite:///./revline.db
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
ENVIRONMENT=development
FREE_SHIPPING_THRESHOLD=75
FLAT_SHIPPING_RATE=9.99
TAX_RATE=0.07
JWT_SECRET=                      # required when ENVIRONMENT=production
ACCESS_TOKEN_TTL_MINUTES=720
RATE_LIMIT_ENABLED=true
RATE_LIMIT_AUTH_MAX=10           # per IP per minute
RATE_LIMIT_WRITE_MAX=60
RATE_LIMIT_DEFAULT_MAX=300
SEED_DEMO_ACCOUNT=true
RUN_MIGRATIONS_ON_STARTUP=true
```

`frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000   # used by the browser
API_URL_INTERNAL=http://127.0.0.1:8000      # used by server components
```

## Migrations

Alembic owns the schema; there is no `create_all`. The database URL comes from `app.config`, not
`alembic.ini`, so the CLI and the running API can never disagree about which database they mean.

```bash
cd backend
.venv/Scripts/python.exe -m alembic revision --autogenerate -m "what changed"
.venv/Scripts/python.exe -m alembic upgrade head
```

Startup runs `upgrade head` itself so a fresh clone boots in two commands; set
`RUN_MIGRATIONS_ON_STARTUP=false` to put migrations back in the deploy step, where they belong in
production. `render_as_batch` is on because SQLite cannot `ALTER` most things in place.

## Security notes

- **Passwords** use stdlib `hashlib.scrypt` (N=2^15, per-user salt), so `pip install` needs no
  compiler on any platform. Cost parameters are stored in the hash string, so they can be raised
  later without invalidating existing rows.
- **Login** runs a scrypt pass even for unknown addresses, so response time does not reveal which
  emails are registered, and returns one message for both failure modes.
- **Carts and orders** that belong to an account are refused to anyone else. Guest orders stay
  reachable by number, because the confirmation page has no token.
- **Rate limiting** is in-process and per-worker — fine for one node, but put Redis behind it or
  limit at the edge before running several.
- **SQLite foreign keys** are enabled explicitly (`PRAGMA foreign_keys=ON`); SQLite ships with
  them off, which would silently allow orphaned garage rows.

## Icon licences

Icons are inlined as SVG in `frontend/src/components/icons.tsx` rather than pulled from a package.
All three sources are permissive, but Apache-2.0 and MIT both ask that you keep the
copyright/licence notice when redistributing — the per-icon comments in that file are that record.
Preserve them, and reproduce this table in a `NOTICE` file if you ship a distributed build.

| Source | Licence | Used for |
| --- | --- | --- |
| [Lucide](https://lucide.dev) | ISC | cart, droplet, battery-charging, wind, fan, wrench |
| [IconPark](https://github.com/bytedance/IconPark) | Apache 2.0 | brake-pads |
| [Tabler](https://tabler.io/icons) | MIT | car-suspension |

The Revline logo (`components/Logo.tsx`, `app/icon.svg`, `public/logo-mark.svg`) and the generated
part artwork (`components/PartArt.tsx`) are original to this project.

**Flaticon note:** Flaticon's *free* tier requires visible attribution ("Icon by … from Flaticon")
wherever the icon appears, or a Premium plan to waive it. No Flaticon assets are used here, and
that constraint is why — swapping one in means taking on the attribution obligation or the
subscription.

## Before this goes near real money

Checkout is wired end to end but **payment is a stub**: the API validates the card shape, keeps
only the last four digits, and charges nothing. Swap `PaymentIn` for a payment-provider token
(Stripe, Adyen) so a real PAN never reaches this server, and you stay out of PCI scope.

Also still stubbed or simplified:

- **Vehicle years are derived**, as described above. Real fitment needs a licensed catalogue
  (ACES/PIES) or VIN decoding.
- **Product data is generated.** Names, prices, stock and reviews are plausible, not real.
- **Stock is a single integer** decremented at checkout under `SELECT … FOR UPDATE`, which SQLite
  honours only at the file-lock level. Move to Postgres before real concurrency.
- **No email** is sent; the confirmation page is the only receipt.
- **No password reset**, no email verification, no refresh tokens — the JWT is the whole session.
