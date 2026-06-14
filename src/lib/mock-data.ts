export type Grade = "A+" | "A" | "B+" | "B" | "C" | "D";

export const gradeColor: Record<Grade, string> = {
  "A+": "var(--color-grade-aplus)",
  "A": "var(--color-grade-a)",
  "B+": "var(--color-grade-bplus)",
  "B": "var(--color-grade-b)",
  "C": "var(--color-grade-c)",
  "D": "var(--color-grade-d)",
};

export type Defect = { label: string; severity: 1 | 2 | 3; x?: number; y?: number };

export type Passport = {
  id: string;
  unitId: string;
  itemName: string;
  category: string;
  thumbnail: string;
  grade: Grade;
  confidence: number; // 0-100
  packaging: "Original" | "Resealed" | "None";
  defects: Defect[];
  hash: string;
  graderNote: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: "Fashion" | "Electronics";
  price: number;
  originalPrice?: number;
  image: string;
  secondLife?: boolean;
  passportId?: string;
  fitNote?: string;
  description: string;
};

export type RescueListing = {
  id: string;
  productId: string;
  name: string;
  image: string;
  grade: Grade;
  discountPrice: number;
  originalPrice: number;
  distanceKm: number;
  ttlMinutes: number; // remaining
  reason: string;
};

export type WishlistEntry = {
  id: string;
  query: string;
  budget: number;
  size?: string;
  matchConfidence?: number;
  matchedProductId?: string;
  matchedName?: string;
  matchedImage?: string;
};

export type LedgerEvent = {
  id: string;
  kind: "Graded" | "Listed" | "Rescued" | "P2P Sold" | "Refurbished" | "Donated" | "Returned" | "Recycled";
  event_type?: "GRADED" | "RESCUED" | "P2P_LISTED" | "P2P_SOLD" | "EXCHANGED" | "DONATED" | "RECYCLED" | "REGRADE_REQUESTED" | "RETURNED" | "REFURBISHED" | "LISTED";
  tx_hash?: string;
  actor: string;
  location: string;
  at: string;
  hash: string;
  note?: string;
};

const img = (q: string, seed: number) =>
  `https://images.unsplash.com/photo-${q}?auto=format&fit=crop&w=900&q=70&sat=-20&seed=${seed}`;

export const passports: Passport[] = [
  {
    id: "pp-001",
    unitId: "RLY-7F2A-91C",
    itemName: "Levi's 511 Slim Raw Denim",
    category: "Fashion · Denim",
    thumbnail: img("1542272604-787c3835535d", 1),
    grade: "A",
    confidence: 96,
    packaging: "Original",
    defects: [
      { label: "Light hem fray", severity: 1, x: 50, y: 88 },
      { label: "Faint wash on knee", severity: 1, x: 42, y: 55 },
    ],
    hash: "0x7f2a91c4e0b8a3d52f0c1e9b4a7c8d1f2e3a4b5c",
    graderNote: "Worn ≤3 times. Original tag retained. Stitching intact.",
  },
  {
    id: "pp-002",
    unitId: "RLY-3B9E-44D",
    itemName: "Sony WH-1000XM5 Headphones",
    category: "Electronics · Audio",
    thumbnail: img("1505740420928-5e560c06d30e", 2),
    grade: "A+",
    confidence: 99,
    packaging: "Original",
    defects: [],
    hash: "0x3b9e44d1a8c7e6b2f5d4c3b1a09876543210fedc",
    graderNote: "Sealed return. Battery cycles: 0. Full warranty transferable.",
  },
  {
    id: "pp-003",
    unitId: "RLY-9C1F-22A",
    itemName: "Uniqlo U Oversized Tee",
    category: "Fashion · Tops",
    thumbnail: img("1521572163474-6864f9cf17ab", 3),
    grade: "B+",
    confidence: 91,
    packaging: "Resealed",
    defects: [
      { label: "Minor pilling on hem", severity: 1, x: 50, y: 78 },
      { label: "Tag removed", severity: 2 },
    ],
    hash: "0x9c1f22a7e6d5c4b3a290876f5e4d3c2b1a098765",
    graderNote: "Laundered once. Color true to original. No structural wear.",
  },
];

export const products: Product[] = [
  { id: "p1", name: "511 Slim Raw Denim", brand: "Levi's", category: "Fashion", price: 1899, originalPrice: 3499, image: img("1542272604-787c3835535d", 1), secondLife: true, passportId: "pp-001", fitNote: "Runs large — most people size down.", description: "Selvedge raw denim, made to age." },
  { id: "p2", name: "WH-1000XM5", brand: "Sony", category: "Electronics", price: 21900, originalPrice: 29990, image: img("1505740420928-5e560c06d30e", 2), secondLife: true, passportId: "pp-002", description: "Industry-leading noise cancellation, certified sealed return." },
  { id: "p3", name: "U Oversized Tee", brand: "Uniqlo", category: "Fashion", price: 599, originalPrice: 1499, image: img("1521572163474-6864f9cf17ab", 3), secondLife: true, passportId: "pp-003", fitNote: "True to size for an oversized cut.", description: "Heavyweight cotton, relaxed silhouette." },
  { id: "p4", name: "Daily Tote", brand: "Baggu", category: "Fashion", price: 1450, image: img("1547949003-9792a18a2601", 4), description: "Recycled ripstop nylon, folds flat." },
  { id: "p5", name: "Kindle Paperwhite", brand: "Amazon", category: "Electronics", price: 8900, originalPrice: 13999, image: img("1592434134753-a70baf7979d5", 5), secondLife: true, description: "Glare-free 6.8\" display." },
  { id: "p6", name: "Cashmere Crew", brand: "Naadam", category: "Fashion", price: 4900, image: img("1434389677669-e08b4cac3105", 6), description: "Mongolian cashmere, ethically sourced." },
  { id: "p7", name: "Logitech MX Master 3S", brand: "Logitech", category: "Electronics", price: 6400, originalPrice: 9995, image: img("1527864550417-7fd91fc51a46", 7), secondLife: true, description: "Quiet clicks, MagSpeed scroll." },
  { id: "p8", name: "Linen Wide Trousers", brand: "COS", category: "Fashion", price: 2700, image: img("1490481651871-ab68de25d43d", 8), description: "Belgian linen, breathable drape." },
  { id: "p9", name: "AeroPress Original", brand: "AeroPress", category: "Electronics", price: 2299, image: img("1495474472287-4d71bcdd2085", 9), description: "Brew-anywhere coffee press." },
  { id: "p10", name: "Wool Field Jacket", brand: "Filson", category: "Fashion", price: 8200, originalPrice: 14500, image: img("1551028719-00167b16eac5", 10), secondLife: true, description: "Mackinaw wool, lifetime-built." },
  { id: "p11", name: "iPad Air 11\"", brand: "Apple", category: "Electronics", price: 41900, originalPrice: 54900, image: img("1561154464-82e9adf32764", 11), secondLife: true, description: "M2 chip, refurbished to factory spec." },
  { id: "p12", name: "Merino Crew Socks (3pk)", brand: "Darn Tough", category: "Fashion", price: 1899, image: img("1586350977771-b3b0abd50c82", 12), description: "Lifetime guarantee, US-made." },
];

export const rescueListings: RescueListing[] = [
  { id: "r1", productId: "p1", name: "Levi's 511 Raw Denim · 32W", image: products[0].image, grade: "A", discountPrice: 1399, originalPrice: 3499, distanceKm: 1.2, ttlMinutes: 47, reason: "Size exchange · Bandra" },
  { id: "r2", productId: "p2", name: "Sony WH-1000XM5 · Black", image: products[1].image, grade: "A+", discountPrice: 18900, originalPrice: 29990, distanceKm: 3.4, ttlMinutes: 22, reason: "Unopened return · Powai" },
  { id: "r3", productId: "p3", name: "Uniqlo U Tee · M Ecru", image: products[2].image, grade: "B+", discountPrice: 449, originalPrice: 1499, distanceKm: 0.6, ttlMinutes: 12, reason: "Fit exchange · Lower Parel" },
  { id: "r4", productId: "p5", name: "Kindle Paperwhite · 16GB", image: products[4].image, grade: "A", discountPrice: 7200, originalPrice: 13999, distanceKm: 2.1, ttlMinutes: 95, reason: "Gift unwanted · Andheri" },
  { id: "r5", productId: "p7", name: "MX Master 3S · Graphite", image: products[6].image, grade: "A", discountPrice: 4900, originalPrice: 9995, distanceKm: 4.8, ttlMinutes: 60, reason: "Wrong model · Worli" },
  { id: "r6", productId: "p10", name: "Filson Field Jacket · L", image: products[9].image, grade: "B+", discountPrice: 6400, originalPrice: 14500, distanceKm: 5.3, ttlMinutes: 180, reason: "Color swap · Colaba" },
];

export const wishlist: WishlistEntry[] = [
  { id: "w1", query: "Raw selvedge denim, size 32, slim fit", budget: 2000, size: "32", matchConfidence: 92, matchedProductId: "p1", matchedName: "Levi's 511 Raw Denim · 32W", matchedImage: products[0].image },
  { id: "w2", query: "Noise-cancelling headphones, sealed", budget: 22000, matchConfidence: 88, matchedProductId: "p2", matchedName: "Sony WH-1000XM5", matchedImage: products[1].image },
  { id: "w3", query: "Oversized cotton tee, ecru, size M", budget: 700, size: "M" },
  { id: "w4", query: "Wool field jacket, size L, earth tones", budget: 7000, size: "L", matchConfidence: 74, matchedProductId: "p10", matchedName: "Filson Wool Field Jacket · L", matchedImage: products[9].image },
];

export const ledgerByUnit: Record<string, LedgerEvent[]> = {
  "RLY-7F2A-91C": [
    { id: "e1", kind: "Returned", actor: "Anaya R.", location: "Mumbai · Bandra", at: "2026-05-12", hash: "0x7f2a…91c4", note: "Reason: size exchange" },
    { id: "e2", kind: "Graded", actor: "Relay AI · v4.2", location: "Hub 07", at: "2026-05-12", hash: "0x7f2a…e0b8", note: "Grade A · 96% confidence" },
    { id: "e3", kind: "Listed", actor: "Relay Rescue", location: "Lower Parel · 1.2km radius", at: "2026-05-13", hash: "0x7f2a…a3d5" },
    { id: "e4", kind: "Rescued", actor: "Karan M.", location: "Lower Parel", at: "2026-05-14", hash: "0x7f2a…2f0c", note: "Claimed at 60% off" },
  ],
  "RLY-3B9E-44D": [
    { id: "e1", kind: "Returned", actor: "Devika S.", location: "Mumbai · Powai", at: "2026-06-02", hash: "0x3b9e…44d1", note: "Unopened gift" },
    { id: "e2", kind: "Graded", actor: "Relay AI · v4.2", location: "Hub 02", at: "2026-06-02", hash: "0x3b9e…a8c7", note: "Grade A+ · sealed" },
    { id: "e3", kind: "Listed", actor: "Certified Second-Life", location: "National", at: "2026-06-03", hash: "0x3b9e…e6b2" },
  ],
  "RLY-9C1F-22A": [
    { id: "e1", kind: "Returned", actor: "Rhea P.", location: "Bengaluru · Indiranagar", at: "2026-04-21", hash: "0x9c1f…22a7", note: "Fit issue" },
    { id: "e2", kind: "Graded", actor: "Relay AI · v4.2", location: "Hub 11", at: "2026-04-21", hash: "0x9c1f…e6d5", note: "Grade B+ · 91%" },
    { id: "e3", kind: "Refurbished", actor: "Partner · CleanCycle", location: "Bengaluru", at: "2026-04-23", hash: "0x9c1f…c4b3", note: "Steam pressed, repackaged" },
    { id: "e4", kind: "P2P Sold", actor: "Meera J.", location: "Koramangala", at: "2026-04-26", hash: "0x9c1f…2908" },
  ],
};

export const activityTicker = [
  { id: "a1", text: "Rescued · iPad Air 11\" graded A in Bengaluru", grade: "A" as Grade },
  { id: "a2", text: "Exchange · Levi's 511 routed to nearby buyer · Mumbai", grade: "A" as Grade },
  { id: "a3", text: "Refurbished · Sony XM5 sealed, listed Certified", grade: "A+" as Grade },
  { id: "a4", text: "P2P · Uniqlo U Tee matched to wishlist · Bengaluru", grade: "B+" as Grade },
  { id: "a5", text: "Donated · 3 jackets to Goonj · Delhi", grade: "B" as Grade },
  { id: "a6", text: "Recycled · 4 phone shells to GreenLoop · Pune", grade: "C" as Grade },
];

export const channels = [
  { id: "exchange", name: "Exchange", desc: "Same item, right size", chip: "Fastest" },
  { id: "rescue", name: "Hyperlocal Rescue", desc: "Nearby buyer, < 24h", chip: "Lowest carbon" },
  { id: "p2p", name: "Peer-to-Peer", desc: "Direct resale, full price", chip: "Best value" },
  { id: "refurb", name: "Refurbish", desc: "Partner restoration", chip: "Restorative" },
  { id: "donate", name: "Donate", desc: "Verified NGO partner", chip: "Social" },
  { id: "recycle", name: "Recycle", desc: "Material recovery", chip: "Last resort" },
];