import { api, uploadReturnMedia, withFallback } from "./api";
import { DEMO_GEO } from "./demo-constants";
import type { Grade, Passport } from "./mock-data";
import { categoryImage } from "./demo-constants";

// ---- DTOs ----

export type ProductDTO = {
  id: string;
  sku: string;
  title: string;
  category: string;
  vertical: string;
  price: number;
  metadata?: Record<string, unknown> | null;
};

export type ProductDetailDTO = ProductDTO & {
  fit_flags?: { flags?: { type: string; message?: string }[] } | null;
};

export type CartDTO = {
  user_id: string;
  items: { id: string; product_id: string; sku?: string | null; size?: string | null; qty: number }[];
  bracketing: {
    flagged: boolean;
    product_id: string;
    distinct_variants: number;
    sizes: string[];
    suggested_size?: string | null;
    message?: string | null;
  }[];
};

export type ImpactWalletDTO = {
  user_id: string;
  total_co2_saved_kg: number;
  credits_balance: number;
  locked_credits: number;
  lifetime_credits: number;
  early_access: boolean;
  early_access_threshold: number;
  events: { channel: string; co2_saved_kg: number; created_at?: string | null }[];
};

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
};

export type WishMatchDTO = {
  wish_id: string;
  unit_id: string;
  score: number;
  distance_km: number | null;
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
  tx_hash?: string | null;
  events: { event_type: string; tx_hash?: string | null; created_at?: string | null }[];
};

// ---- Fetchers ----

export const demoReset = () =>
  api<{ status: string; detail: Record<string, unknown> }>("/demo/reset", { method: "POST" });

export const getProducts = (fallback: ProductDTO[] = []) =>
  withFallback(api<ProductDTO[]>("/products"), fallback);

export const getProduct = (id: string) => api<ProductDetailDTO>(`/products/${id}`);

export const getCart = (fallback?: CartDTO) =>
  withFallback(api<CartDTO>("/cart"), fallback as CartDTO);

export const getImpact = (fallback: ImpactWalletDTO) =>
  withFallback(api<ImpactWalletDTO>("/users/me/impact"), fallback);

export const getRescueFeed = (
  geo = DEMO_GEO,
  fallback: RescueListingDTO[] = [],
) =>
  withFallback(
    api<RescueListingDTO[]>(
      `/rescue/feed?lat=${geo.lat}&lng=${geo.lng}&radius_km=15`,
    ),
    fallback,
  );

export const getWishMatches = (fallback: WishMatchDTO[] = []) =>
  withFallback(api<WishMatchDTO[]>("/wishlist/matches"), fallback);

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

export const createReturn = (unitId: string, reasonCode: string) =>
  api<{ id: string }>("/returns", {
    method: "POST",
    json: { unit_id: unitId, reason_code: reasonCode },
  });

export { uploadReturnMedia };

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
    packaging: p.packaging_state === "sealed" ? "Original" : p.packaging_state === "opened" ? "Resealed" : "None",
    defects: p.defects.map((d) => ({
      label: d.description ?? d.type.replace(/_/g, " "),
      severity: sevMap[d.severity] ?? 1,
    })),
    hash: p.passport_hash ?? "",
    graderNote: p.notes ?? "Graded by Relay AI · demo-safe mock pipeline.",
  };
}

export { DEMO_GEO };
