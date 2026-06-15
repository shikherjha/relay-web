/** Deterministic IDs from relay-api seed — stable across POST /demo/reset. */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const BUYER_USER_ID = "00000000-0000-0000-0000-000000000002";

export const HERO_HOODIE_UNIT_ID = "00000000-0000-0000-0000-0000000000b1";
export const HERO_JEANS_UNIT_ID = "00000000-0000-0000-0000-0000000000b2";
export const HERO_HEADPHONES_UNIT_ID = "00000000-0000-0000-0000-0000000000b3";

export const P_HOODIE = "00000000-0000-0000-0000-0000000000a3";
export const P_JEANS = "00000000-0000-0000-0000-0000000000a2";
export const P_TSHIRT = "00000000-0000-0000-0000-0000000000a1";
export const P_HEADPHONES = "00000000-0000-0000-0000-0000000000a4";

export const DEMO_GEO = { lat: 12.9716, lng: 77.5946 };

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${q}?auto=format&fit=crop&w=900&q=70&sat=-20&seed=${seed}`;

export const CATEGORY_IMAGES: Record<string, string> = {
  tshirt: img("1521572163474-6864f9cf17ab", 3),
  hoodie: img("1556821840-3cf63f967088", 8),
  jeans: img("1542272604-787c3835535d", 1),
  headphones: img("1505740420928-5e560c06d30e", 2),
  jacket: img("1551028719-00167b16eac5", 11),
  sneakers: img("1542291026-7eec264c27ff", 12),
  dress: img("1572804013309-59a88b7e92f1", 13),
  smartwatch: img("1523275335684-37898b6baf30", 14),
  watch: img("1524592094714-0f0654e20314", 15),
  backpack: img("1553062407-98eeb64c6a62", 16),
  speaker: img("1608043152269-423dbba4e7e1", 17),
  camera: img("1516035069371-29a1b244cc32", 18),
  sunglasses: img("1511499767150-a48a237f0083", 19),
  keyboard: img("1587829741301-dc798b83add3", 20),
  coat: img("1539533018447-63fcce2678e3", 21),
  fashion: img("1542272604-787c3835535d", 1),
  electronics: img("1505740420928-5e560c06d30e", 2),
};

export function categoryImage(category?: string | null, vertical?: string | null): string {
  if (category && CATEGORY_IMAGES[category]) return CATEGORY_IMAGES[category];
  if (vertical && CATEGORY_IMAGES[vertical]) return CATEGORY_IMAGES[vertical];
  return CATEGORY_IMAGES.fashion;
}

/**
 * Prefer a real product/listing `image_url` from the API; gracefully fall back
 * to the deterministic category image when it's null/blank.
 *
 * - Absolute URLs (S3/CDN, http/https) are used as-is.
 * - Server-relative paths (e.g. "/static/products/x.jpg") are resolved against
 *   the API origin, which is the service that actually serves those files
 *   (otherwise the browser would request them from the web origin and 404).
 */
const IMG_API_BASE = (
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_URL ??
  "http://127.0.0.1:8010"
).replace(/\/$/, "");

export function productImage(
  imageUrl?: string | null,
  category?: string | null,
  vertical?: string | null,
): string {
  const u = imageUrl?.trim();
  if (u) {
    if (/^https?:\/\//i.test(u)) return u;
    if (u.startsWith("/")) return `${IMG_API_BASE}${u}`;
    return u;
  }
  return categoryImage(category, vertical);
}

/** API stores discounts as 0–1 fractions; UI clocks use 0–100 percents. */
export function pctFraction(n: number | null | undefined): number {
  if (n == null) return 15;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}
