export type CategoryShape = "circle" | "diamond" | "square";

/**
 * Four fitment states, matching the API. `null` means the request carried no
 * vehicle, so fitment was never evaluated — which is a different thing from
 * "does not fit" and the UI must not conflate them.
 */
export type FitStatus = "universal" | "fits" | "partial" | "no";

export type SortKey = "relevance" | "popular" | "price-asc" | "price-desc" | "rating" | "newest";

export interface Category {
  id: string;
  name: string;
  shape: CategoryShape;
  blurb: string;
  product_count: number;
}

export interface ProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  type: "OEM" | "Performance";
  price: number;
  compare_at_price: number | null;
  badge: string | null;
  brand: string;
  rating: number;
  review_count: number;
  in_stock: boolean;
  fits_vehicle: FitStatus | null;
}

export interface Review {
  author: string;
  rating: number;
  body: string;
  vehicle_label: string | null;
}

export interface FitmentRange {
  make: string;
  model: string | null;
  year_min: number;
  year_max: number;
  note: string | null;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  stock_quantity: number;
  warranty: string;
  weight_grams: number;
  universal_fit: boolean;
  fitment_note: string;
  fitment_ranges: FitmentRange[];
  reviews: Review[];
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface ProductFacets {
  categories: FacetValue[];
  types: FacetValue[];
  brands: FacetValue[];
  badges: FacetValue[];
}

export interface ProductList {
  count: number;
  total: number;
  page: number;
  pages: number;
  page_size: number;
  sort: SortKey;
  results: ProductSummary[];
  facets: ProductFacets | null;
}

/* ------------------------------------------------------------- vehicles */

export interface Make {
  slug: string;
  name: string;
  country: string;
  tier: "exotic" | "luxury" | "mainstream";
  model_count: number;
}

export interface VehicleModel {
  slug: string;
  name: string;
  body_style: string;
  powertrain: string;
  is_performance: boolean;
  year_start: number;
  year_end: number;
}

export interface ModelSearchHit extends VehicleModel {
  make: string;
  make_slug: string;
  label: string;
}

export interface VehicleOptions {
  years: number[];
  makes: Make[];
  model_count: number;
  /** Columns the import script derives; the source CSV has make and model only. */
  derived_fields: string[];
}

/** A saved vehicle. Lives on the account when signed in, else on the cart. */
export interface GarageVehicle {
  id: number;
  year: number;
  make: string;
  make_slug: string;
  model: string;
  model_slug: string;
  body_style: string;
  powertrain: string;
  nickname: string | null;
  label: string;
}

/* ------------------------------------------------------------- accounts */

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

/* ----------------------------------------------------------------- cart */

export interface CartItem {
  product_id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  stock_quantity: number;
  fits_vehicle: FitStatus | null;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  free_shipping_threshold: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  item_count: number;
  totals: CartTotals;
  vehicle: GarageVehicle | null;
  user_id: string | null;
}

/* --------------------------------------------------------------- orders */

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name: string;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: number;
  created_at: string;
  email: string | null;
  full_name: string;
  card_last4: string;
  vehicle_label: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  items: OrderItem[];
}

export interface OrderSummary {
  order_number: number;
  created_at: string;
  total: number;
  item_count: number;
  vehicle_label: string | null;
}

export interface ShippingAddress {
  full_name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface PaymentDetails {
  card_number: string;
  exp: string;
  cvv: string;
}

/* ---------------------------------------------------------------- query */

export interface ProductQuery {
  category?: string;
  type?: string;
  badge?: string;
  brand?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  fits_only?: boolean;
  year?: number;
  make?: string;
  model?: string;
  cart_id?: string;
  sort?: SortKey;
  page?: number;
  page_size?: number;
  with_facets?: boolean;
}
