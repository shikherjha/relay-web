import { products, passports, rescueListings, ledgerByUnit, type Grade } from "./mock-data";

export type DispositionChannel = "exchange" | "rescue" | "p2p_resale" | "refurb" | "donate" | "recycle" | "restock";

export type LedgerEventType =
  | "GRADED" | "RESCUED" | "P2P_LISTED" | "P2P_SOLD"
  | "EXCHANGED" | "DONATED" | "RECYCLED" | "REGRADE_REQUESTED"
  | "RETURNED" | "REFURBISHED" | "LISTED";

const kindToType: Record<string, LedgerEventType> = {
  Graded: "GRADED",
  Rescued: "RESCUED",
  "P2P Sold": "P2P_SOLD",
  Listed: "P2P_LISTED",
  Donated: "DONATED",
  Returned: "RETURNED",
  Refurbished: "REFURBISHED",
  Recycled: "RECYCLED",
};

export function ledgerVerify(unitId: string) {
  const events = (ledgerByUnit[unitId] ?? []).map((e) => ({
    event_type: (e.event_type ?? kindToType[e.kind] ?? "GRADED") as LedgerEventType,
    tx_hash: e.tx_hash ?? `0x${(unitId + e.id).replace(/[^0-9a-f]/gi, "").padEnd(40, "f").slice(0, 40)}`,
    passport_hash: e.hash,
    created_at: e.at,
    actor: e.actor,
    location: e.location,
    note: e.note,
    kind: e.kind,
  }));
  const passport = passports.find((p) => p.unitId === unitId);
  return {
    unit_id: unitId,
    verified: true,
    passport_hash: passport?.hash ?? `0x${unitId.replace(/-/g, "").padEnd(40, "0")}`,
    on_chain_hash: passport?.hash ?? "",
    tx_hash: events[events.length - 1]?.tx_hash ?? "0x0",
    events: events.reverse(),
    passport,
  };
}

// ===== Rescue live (decay) =====
export const rescueLive = rescueListings.map((r, i) => ({
  id: r.id,
  unit_id: passports[i % passports.length].unitId,
  product_id: r.productId,
  name: r.name,
  image: r.image,
  grade: r.grade as Grade,
  reason: r.reason,
  distance_km: r.distanceKm,
  original_price: r.originalPrice,
  base_discount_pct: 15,
  max_discount_pct: [45, 55, 65, 50, 50, 40][i] ?? 45,
  current_discount_pct: Math.round(15 + (1 - r.ttlMinutes / 240) * 30),
  ttl_seconds: r.ttlMinutes * 60,
  expires_at: new Date(Date.now() + r.ttlMinutes * 60_000).toISOString(),
  status: "active",
  guardrails_applied: [] as string[],
}));

// ===== Ops =====
export const opsHighReturnSkus = [
  { sku: "LV-511-RAW",   title: "Levi's 511 Raw Denim",        return_count: 142, return_rate: 0.34, dominant_reason: "size" },
  { sku: "UQ-U-OVR",     title: "Uniqlo U Oversized Tee",      return_count: 98,  return_rate: 0.27, dominant_reason: "not as shown" },
  { sku: "SN-XM5-BLK",   title: "Sony WH-1000XM5",             return_count: 41,  return_rate: 0.06, dominant_reason: "wrong item" },
  { sku: "FIL-FLD-WOOL", title: "Filson Wool Field Jacket",    return_count: 67,  return_rate: 0.22, dominant_reason: "color" },
  { sku: "NAA-CASH-CRW", title: "Naadam Cashmere Crew",        return_count: 33,  return_rate: 0.11, dominant_reason: "size" },
];

export const opsSellerSignals = [
  { sku: "UQ-U-OVR",    flagged: true,  return_rate: 0.34, primary_reason: "not as shown", recommendation: "Update product photos — buyers report color mismatch on ecru." },
  { sku: "LV-511-RAW",  flagged: true,  return_rate: 0.34, primary_reason: "size",         recommendation: "Add a size chart note: this style runs ~1 size large." },
  { sku: "FIL-FLD-WOOL",flagged: true,  return_rate: 0.22, primary_reason: "color",        recommendation: "Reshoot under daylight — current images skew warm." },
];

export const opsChainDepth = [
  { unit_id: "RLY-7F2A-91C", title: "Levi's 511 Raw Denim",   transfer_count: 2, cap: 4, forced_channel: null },
  { unit_id: "RLY-3B9E-44D", title: "Sony WH-1000XM5",        transfer_count: 1, cap: 4, forced_channel: null },
  { unit_id: "RLY-9C1F-22A", title: "Uniqlo U Oversized Tee", transfer_count: 4, cap: 4, forced_channel: "refurb" as DispositionChannel },
  { unit_id: "RLY-AA21-77F", title: "Cashmere Crew",          transfer_count: 5, cap: 4, forced_channel: "recycle" as DispositionChannel },
];

export const opsImpact = { total_co2_saved_kg: 12480.4, rescued_units: 5217 };

// ===== Pair rescue =====
export const pairMatches = [
  {
    id: "pm1",
    score: 0.94,
    distance_km: 0.8,
    unit_a: { unit_id: "RLY-7F2A-91C", title: "Levi's 511 · 32W", image: products[0].image, grade: "A" as Grade, owner: "Anaya R." },
    unit_b: { unit_id: "RLY-LL-014",   title: "Levi's 511 · 34W", image: products[0].image, grade: "A" as Grade, owner: "Karan M." },
  },
  {
    id: "pm2",
    score: 0.87,
    distance_km: 2.1,
    unit_a: { unit_id: "RLY-9C1F-22A", title: "Uniqlo U Tee · M", image: products[2].image, grade: "B+" as Grade, owner: "Rhea P." },
    unit_b: { unit_id: "RLY-LL-022",   title: "Uniqlo U Tee · L", image: products[2].image, grade: "A" as Grade, owner: "Meera J." },
  },
];

// ===== Cart bracketing =====
export function detectBracketing(cart: { productId: string; size: string }[]) {
  const byProduct = new Map<string, Set<string>>();
  cart.forEach((c) => {
    if (!byProduct.has(c.productId)) byProduct.set(c.productId, new Set());
    byProduct.get(c.productId)!.add(c.size);
  });
  const flagged: { product_id: string; distinct_variants: number; sizes: string[]; suggested_size: string; message: string }[] = [];
  byProduct.forEach((sizes, productId) => {
    if (sizes.size >= 3) {
      const arr = Array.from(sizes);
      const product = products.find((p) => p.id === productId);
      const suggested = arr[Math.floor(arr.length / 2)];
      flagged.push({
        product_id: productId,
        distinct_variants: sizes.size,
        sizes: arr,
        suggested_size: suggested,
        message: `You've added ${sizes.size} sizes of ${product?.name ?? "this item"} — keep the one that fits. Your fit profile suggests ${suggested}.`,
      });
    }
  });
  return flagged;
}

// ===== Warranty (electronics) =====
export const warrantyByUnit: Record<string, { months_remaining: number; transferable: boolean; history: { date: string; event: string }[] }> = {
  "RLY-3B9E-44D": {
    months_remaining: 22,
    transferable: true,
    history: [
      { date: "2025-08-01", event: "Original purchase · authorized retailer" },
      { date: "2026-06-02", event: "Sealed return verified by Relay AI" },
    ],
  },
};

// ===== Disposition outcome =====
export function dispositionFor(reasonCode: string, passportGrade: Grade) {
  if (reasonCode === "size" || reasonCode === "fit") {
    return {
      channel: "exchange" as DispositionChannel,
      score: 0.92,
      reasons: ["Reason: size", `Grade ${passportGrade} · resaleable`, "Exchange-friendly category", "Inventory available nearby"],
      guardrails_applied: [] as string[],
      net_co2_saved_kg: 1.8,
      credits_earned: 32,
    };
  }
  return {
    channel: "rescue" as DispositionChannel,
    score: 0.96,
    reasons: [`Grade ${passportGrade} · 96% confidence`, "Buyer demand within 1.2km", "Carbon-optimal route", "Avoids warehouse return"],
    guardrails_applied: ["14-day keep-period hold"] as string[],
    net_co2_saved_kg: 2.4,
    credits_earned: 40,
  };
}

export const channelMeta: Record<DispositionChannel, { name: string; line: string }> = {
  exchange:   { name: "Exchange",         line: "Same item, right size — fastest path home." },
  rescue:     { name: "Hyperlocal Rescue",line: "Nearby buyer within 24h — lowest carbon." },
  p2p_resale: { name: "Peer-to-Peer",     line: "Direct resale to a verified buyer." },
  refurb:     { name: "Refurbish",        line: "Partner restoration before relisting." },
  donate:     { name: "Donate",           line: "Routed to a verified NGO partner." },
  recycle:    { name: "Recycle",          line: "Material recovery — last responsible step." },
  restock:    { name: "Restock",          line: "Returns to main marketplace inventory." },
};