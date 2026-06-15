import { api, uploadFiles, uploadReturnMedia, uploadReturnMediaFiles, withFallback } from "./api";
import { DEMO_GEO } from "./demo-constants";
import type { Grade, Passport, PassportVerification } from "./mock-data";
import { categoryImage } from "./demo-constants";

// ---- DTOs ----

export type ProductDTO = {
  id: string;
  sku: string;
  title: string;
  category: string;
  vertical: string;
  price: number;
  // Real product imagery (additive). Render via productImage() with a fallback.
  image_url?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** AI-suggested price band shared by resale listings, rescue feed, Genie. */
export type PriceRange = { min: number; max: number };

export type ProductDetailDTO = ProductDTO & {
  fit_flags?: { flags?: { type: string; message?: string }[] } | null;
};

export type CartDTO = {
  user_id: string;
  items: {
    id: string;
    product_id: string;
    sku?: string | null;
    size?: string | null;
    qty: number;
  }[];
  bracketing: {
    flagged: boolean;
    product_id: string;
    distinct_variants: number;
    sizes: string[];
    suggested_size?: string | null;
    message?: string | null;
  }[];
};

// ---- Layer-1 (Amazon) orders ----

export type OrderItemDTO = {
  id: string;
  product_id: string;
  unit_id?: string | null;
  title: string;
  category?: string | null;
  size?: string | null;
  price: number;
  returnable: boolean;
  returned: boolean;
  return_id?: string | null;
  // Second-life lifecycle (additive): delivery timestamp drives the return/resell
  // window. `resellable` = window expired, still owned, not yet listed.
  delivered_at?: string | null;
  resellable?: boolean;
  days_to_return_deadline?: number | null;
  // `listed` = this unit now has an active Second-Life listing (it was resold).
  listed?: boolean;
  // Post-return state: "return_to_seller" (wrong_item), "exchanged", etc.
  return_state?: string | null;
};

export type OrderDTO = {
  id: string;
  user_id?: string | null;
  created_at?: string | null;
  status?: string | null;
  total?: number | null;
  items: OrderItemDTO[];
};

export type ImpactTierDTO = {
  name: string; // "standard" | "silver" | "gold"
  threshold: number;
  early_access_hours: number;
  unlocked: boolean;
};

export type ImpactWalletDTO = {
  user_id: string;
  total_co2_saved_kg: number;
  credits_balance: number;
  locked_credits: number;
  lifetime_credits: number;
  // Tiered early-access model (current backend).
  tier?: string | null;
  next_tier?: string | null;
  credits_to_next_tier?: number | null;
  tiers?: ImpactTierDTO[];
  // Legacy early-access fields — kept optional for back-compat / fallbacks.
  early_access?: boolean;
  early_access_threshold?: number;
  events?: { channel: string; co2_saved_kg: number; created_at?: string | null }[];
};

/** Derive early-access from either the tiered model or the legacy flag. */
export function walletEarlyAccess(
  w?: Pick<ImpactWalletDTO, "early_access" | "tier"> | null,
): boolean {
  if (!w) return false;
  if (typeof w.early_access === "boolean") return w.early_access;
  return Boolean(w.tier && w.tier !== "standard");
}

export type RescueListingDTO = {
  id: string;
  unit_id: string;
  discount_pct: number;
  base_discount_pct: number | null;
  current_discount_pct: number | null;
  ttl_seconds: number | null;
  expires_at: string | null;
  status: string;
  distance_km: number | null;
  early_access: boolean;
  early_access_until: string | null;
  title?: string | null;
  category?: string | null;
  vertical?: string | null;
  original_price?: number | null;
  grade?: string | null;
  reason?: string | null;
  max_discount_pct?: number | null;
  // Two-path + tiered rescue.
  scope?: "local" | "national" | string | null;
  ships?: boolean | null;
  fulfillment?: "local_pickup" | "courier" | "shipped" | string | null;
  pickup_anchored?: boolean | null;
  // AI-suggested resale pricing (additive).
  list_price?: number | null;
  price_range?: PriceRange | null;
};

export type RescueScope = "local" | "national" | "all";

export type WishMatchDTO = {
  wish_id: string;
  unit_id: string;
  score: number;
  distance_km: number | null;
  title?: string | null;
  category?: string | null;
  grade?: string | null;
  price?: number | null;
  scope?: "local" | "national" | string | null;
  fulfillment?: string | null;
  // AI-suggested resale pricing + budget fit (additive).
  list_price?: number | null;
  price_range?: PriceRange | null;
  price_fit?: boolean | null;
};

// ---- Track B · Second Life (resale marketplace) ----

export type ResaleSource = "p2p" | "certified";

export type ResaleListing = {
  id: string;
  unit_id: string;
  source: ResaleSource;
  title: string;
  category: string;
  vertical: string;
  // Catalogue image (absolute https S3 URL from the order/product).
  image_url: string | null;
  // Reseller-uploaded condition photos/video (absolute https S3 URLs). Additive.
  media_urls?: string[];
  resale_grade: string;
  original_price: number;
  price_range: PriceRange;
  list_price: number;
  age_days: number;
  lister_label: string;
  ships: boolean;
  fulfillment: string;
  status: string;
  escrow_status: string;
  passport_id: string | null;
  lifeledger_unit_id: string | null;
  // Optional AI order-vs-item verification (additive).
  verification?: PassportVerification | null;
};

/** The AI assessment surfaced after a resell/relist upload (subset of a listing). */
export type ResaleAssessment = Pick<
  ResaleListing,
  "resale_grade" | "original_price" | "price_range" | "list_price" | "passport_id" | "lifeledger_unit_id"
>;

export type BuyResult = {
  ok: boolean;
  listing_id: string;
  escrow_status: string; // "released" in the stubbed demo flow
  new_owner_id: string;
  tx_hash: string;
};

/**
 * POST /orders/items/{id}/exchange — no ML grading. The pristine returned unit is
 * auto-listed on rescue (at original/minimal discount until pickup) by the backend.
 */
export type ExchangeResult = {
  exchange_id: string;
  replacement: {
    order_item_id: string;
    size?: string | null;
    variant?: string | null;
    title: string;
  };
  rescue_listing: {
    id: string;
    list_price?: number | null;
    title?: string | null;
    original_price?: number | null;
  };
};

/** GET /seller/refurbished — returned units graded refurbished, ready to relist. */
export type SellerRefurbUnitDTO = {
  unit_id: string;
  title: string;
  category: string;
  vertical: string;
  image_url: string | null;
  original_price: number;
  age_days: number;
  last_event: string;
  grade: string;
};

export type SellerOrderStatus =
  | "delivered"
  | "returned"
  | "refurbished"
  | "relisted"
  | "sold"
  | string;

/** GET /seller/orders — the seller's full sold history, most-recent first. */
export type SellerOrderItemDTO = {
  order_id: string;
  order_item_id: string;
  unit_id: string;
  title: string;
  category: string;
  vertical: string;
  image_url: string | null;
  sale_price: number;
  sold_at: string | null;
  delivered_at: string | null;
  buyer_label: string;
  status: SellerOrderStatus;
  relistable: boolean;
  listing_id: string | null;
  age_days: number;
  last_event: string;
};

export type ReturnDTO = {
  id: string;
  order_item_id?: string | null;
  unit_id?: string | null;
  reason_code?: string | null;
  pickup_slot?: string | null;
  pickup_at?: string | null;
  status?: string | null;
};

export type PairMatchDTO = {
  unit_a: string;
  unit_b: string;
  user_a: string | null;
  user_b: string | null;
  score: number;
  distance_km: number | null;
  status: string;
};

export type ApiPassport = {
  unit_id: string;
  return_id?: string | null;
  grade: Grade;
  grade_numeric: number;
  category?: string | null;
  vertical: string;
  confidence: number;
  packaging_state?: string | null;
  defects: { type: string; severity: string; description?: string | null }[];
  passport_hash?: string | null;
  notes?: string | null;
  // Optional AI order-vs-item verification (additive).
  verification?: PassportVerification | null;
};

export type DispositionDTO = {
  channel: string;
  score: number;
  reasons: string[];
  guardrails_applied: string[];
  net_co2_saved_kg?: number | null;
};

export type HighReturnSkuDTO = {
  sku: string;
  title: string | null;
  return_count: number;
  return_rate: number;
  dominant_reason: string | null;
  recommendation: string | null;
};

export type ChainDepthRowDTO = {
  unit_id: string;
  transfer_count: number;
  forced_channel: string | null;
};

export type OpsImpactDTO = {
  total_co2_saved_kg: number;
  rescued_units: number;
};

export type LedgerVerifyDTO = {
  unit_id: string;
  verified: boolean;
  passport_hash?: string | null;
  on_chain_hash?: string | null;
  tx_hash?: string | null;
  events: {
    event_type: string;
    tx_hash?: string | null;
    created_at?: string | null;
    actor?: string | null;
    location?: string | null;
    note?: string | null;
  }[];
  // Product context + imagery (catalogue + every user-uploaded condition shot).
  title?: string | null;
  category?: string | null;
  vertical?: string | null;
  image_url?: string | null;
  grade?: string | null;
  media_urls?: string[];
};

// ---- Buyer dashboard tracking (returns + p2p resells) ----

export type ReturnTrackingDTO = {
  return_id: string;
  unit_id: string;
  order_item_id?: string | null;
  title?: string | null;
  category?: string | null;
  vertical?: string | null;
  image_url?: string | null;
  reason_code?: string | null;
  status: string; // initiated | picked_up | graded | flagged
  created_at?: string | null;
  pickup_slot?: string | null;
  grade?: string | null;
  media_urls?: string[];
  disposition_channel?: string | null;
  rescue_listed?: boolean;
  second_life_listed?: boolean;
};

export type ResaleTrackingDTO = {
  listing_id: string;
  unit_id: string;
  title?: string | null;
  category?: string | null;
  vertical?: string | null;
  image_url?: string | null;
  source: string;
  resale_grade?: string | null;
  list_price?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  status: string; // active | sold
  escrow_status: string;
  age_days?: number | null;
  created_at?: string | null;
  media_urls?: string[];
};

// ---- Fetchers ----

export const demoReset = () =>
  api<{ status: string; detail: Record<string, unknown> }>("/demo/reset", { method: "POST" });

export const getProducts = (fallback: ProductDTO[] = []) =>
  withFallback(api<ProductDTO[]>("/products"), fallback);

export const getProduct = (id: string) => api<ProductDetailDTO>(`/products/${id}`);

export const getCart = (fallback?: CartDTO) =>
  withFallback(api<CartDTO>("/cart"), fallback as CartDTO);

export const postCart = (body: { product_id: string; size?: string; qty?: number }) =>
  api<CartDTO>("/cart", { method: "POST", json: body });

// ---- Layer-1 orders + checkout ----

export const getOrders = (fallback: OrderDTO[] = []) =>
  withFallback(api<OrderDTO[]>("/orders"), fallback);

export const getOrder = (id: string) => api<OrderDTO>(`/orders/${id}`);

export const checkout = (body?: {
  items?: unknown[];
  geo?: { lat: number; lng: number };
  clear_cart?: boolean;
}) => api<OrderDTO>("/orders/checkout", { method: "POST", json: body ?? {} });

export const getImpact = (fallback: ImpactWalletDTO) =>
  withFallback(api<ImpactWalletDTO>("/users/me/impact"), fallback);

/** Buyer dashboard — track every return end-to-end (status, grade, next home). */
export const getMyReturns = (fallback: ReturnTrackingDTO[] = []) =>
  withFallback(api<ReturnTrackingDTO[]>("/users/me/returns"), fallback);

/** Buyer dashboard — the caller's own p2p Second-Life resale listings. */
export const getMyResales = (fallback: ResaleTrackingDTO[] = []) =>
  withFallback(api<ResaleTrackingDTO[]>("/users/me/resales"), fallback);

export const getRescueFeed = (
  geo = DEMO_GEO,
  opts: { scope?: RescueScope; radiusKm?: number; fallback?: RescueListingDTO[] } = {},
) => {
  const { scope = "all", radiusKm = 15, fallback = [] } = opts;
  return withFallback(
    api<RescueListingDTO[]>(
      `/rescue/feed?lat=${geo.lat}&lng=${geo.lng}&radius_km=${radiusKm}&scope=${scope}`,
    ),
    fallback,
  );
};

export const getWishMatches = (fallback: WishMatchDTO[] = []) =>
  withFallback(api<WishMatchDTO[]>("/wishlist/matches"), fallback);

// ---- Track B · Second Life fetchers ----

/** Buyer catalogue: member resell (p2p) + Certified Second-Life (certified). */
export const getSecondLife = (
  opts: { vertical?: string; category?: string; fallback?: ResaleListing[] } = {},
) => {
  const params = new URLSearchParams();
  if (opts.vertical) params.set("vertical", opts.vertical);
  if (opts.category) params.set("category", opts.category);
  const qs = params.toString();
  return withFallback(
    api<ResaleListing[]>(`/second-life${qs ? `?${qs}` : ""}`),
    opts.fallback ?? [],
  );
};

/** Stubbed demo payment → escrow released, ownership transferred on LifeLedger. */
export const buySecondLife = (listingId: string) =>
  api<BuyResult>(`/second-life/${listingId}/buy`, { method: "POST" });

/** Buyer resells a delivered, owned item once the return window has expired. */
export const resellOrderItem = (orderItemId: string, files: Blob[]) =>
  uploadFiles<ResaleListing>(`/orders/items/${orderItemId}/resell`, files, "resale");

/** In-window exchange (no grading). Backend auto-lists the pristine unit on rescue. */
export const exchangeOrderItem = (
  orderItemId: string,
  body: { new_size?: string; new_variant?: string; pickup_slot?: string },
) =>
  api<ExchangeResult>(`/orders/items/${orderItemId}/exchange`, { method: "POST", json: body });

/**
 * Gated wrong-item return: records + flags for the seller only. No media, no
 * grade, NOT a rescue/second-life asset.
 */
export const flagWrongItemReturn = (orderItemId: string) =>
  api<ReturnDTO>(`/orders/items/${orderItemId}/return`, {
    method: "POST",
    json: { reason: "wrong_item" },
  });

/** Seller's full sold history (most-recent first); relistable rows can refurb-relist. */
export const getSellerOrders = (fallback: SellerOrderItemDTO[] = []) =>
  withFallback(api<SellerOrderItemDTO[]>("/seller/orders"), fallback);

/** Seller's returned units graded refurbished, eligible for Certified relist. */
export const getSellerRefurbished = (fallback: SellerRefurbUnitDTO[] = []) =>
  withFallback(api<SellerRefurbUnitDTO[]>("/seller/refurbished"), fallback);

/** Seller relists a refurbished unit → Certified Second-Life listing. */
export const relistSellerUnit = (unitId: string, files: Blob[]) =>
  uploadFiles<ResaleListing>(`/seller/units/${unitId}/relist`, files, "relist");

export const postWish = (body: { category: string; size?: string; max_price?: number }) =>
  api<{ id: string; wish_score?: number | null }>("/wishlist", { method: "POST", json: body });

export const getPairMatches = (fallback: PairMatchDTO[] = []) =>
  withFallback(api<PairMatchDTO[]>("/rescue/pair-matches?radius_km=15"), fallback);

export const getHighReturnSkus = (fallback: HighReturnSkuDTO[] = []) =>
  withFallback(api<HighReturnSkuDTO[]>("/ops/high-return-skus"), fallback);

export const getSellerSignals = (fallback: HighReturnSkuDTO[] = []) =>
  withFallback(api<HighReturnSkuDTO[]>("/ops/seller-signals"), fallback);

export const getChainDepth = (fallback: ChainDepthRowDTO[] = []) =>
  withFallback(api<ChainDepthRowDTO[]>("/ops/chain-depth"), fallback);

export const getOpsImpact = (fallback: OpsImpactDTO) =>
  withFallback(api<OpsImpactDTO>("/ops/impact"), fallback);

export const createReturn = (args: {
  orderItemId?: string;
  unitId?: string;
  reasonCode: string;
  pickupSlot?: string;
}) =>
  api<ReturnDTO>("/returns", {
    method: "POST",
    json: {
      // order_item_id is preferred; unit_id is the legacy/fallback anchor.
      ...(args.orderItemId ? { order_item_id: args.orderItemId } : {}),
      ...(args.unitId ? { unit_id: args.unitId } : {}),
      reason_code: args.reasonCode,
      ...(args.pickupSlot ? { pickup_slot: args.pickupSlot } : {}),
    },
  });

export { uploadReturnMedia, uploadReturnMediaFiles };

export const getReturnPassport = (returnId: string) =>
  api<ApiPassport>(`/returns/${returnId}/passport`);

export const computeDisposition = (returnId: string) =>
  api<DispositionDTO>(`/returns/${returnId}/disposition`, { method: "POST" });

export const verifyLedger = (unitId: string, fallback?: LedgerVerifyDTO) =>
  withFallback(api<LedgerVerifyDTO>(`/lifeledger/${unitId}/verify`), fallback as LedgerVerifyDTO);

export const claimRescue = (listingId: string) =>
  api<{ listing: RescueListingDTO; claimed: boolean; guardrails_applied: string[] }>(
    `/rescue/${listingId}/claim`,
    { method: "POST" },
  );

// ---- Mappers ----

export function apiPassportToUi(p: ApiPassport, title: string): Passport {
  const sevMap: Record<string, 1 | 2 | 3> = { minor: 1, moderate: 2, major: 3 };
  return {
    id: p.return_id ?? p.unit_id,
    unitId: p.unit_id,
    itemName: title,
    category: `${p.vertical} · ${p.category ?? "item"}`,
    thumbnail: categoryImage(p.category, p.vertical),
    grade: p.grade,
    confidence: Math.round(p.confidence * 100),
    packaging:
      p.packaging_state === "sealed"
        ? "Original"
        : p.packaging_state === "opened"
          ? "Resealed"
          : "None",
    defects: p.defects.map((d) => ({
      label: d.description ?? d.type.replace(/_/g, " "),
      severity: sevMap[d.severity] ?? 1,
    })),
    hash: p.passport_hash ?? "",
    graderNote: p.notes ?? "Graded by Relay AI · demo-safe mock pipeline.",
    verification: p.verification ?? undefined,
  };
}

export { DEMO_GEO };
