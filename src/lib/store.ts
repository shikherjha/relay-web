import { create } from "zustand";
import { BUYER_USER_ID, DEMO_USER_ID } from "./demo-constants";

export type Persona = "seller" | "buyer";

/**
 * Client-side fallback tier ladder. The live impact API returns the authoritative
 * `tiers[]` (standard/silver/gold); this is only used when the backend is offline.
 */
export type Tier = "standard" | "silver" | "gold";
export const TIER_STEPS: { tier: Tier; label: string; min: number; headStart: string }[] = [
  { tier: "standard", label: "Standard", min: 0, headStart: "Public listings" },
  { tier: "silver", label: "Silver", min: 1000, headStart: "3-hour head start on new rescues" },
  { tier: "gold", label: "Gold", min: 2500, headStart: "See new rescues first" },
];

export function tierFor(credits: number): {
  current: Tier;
  next?: Tier;
  toNext: number;
  pct: number;
  headStart: string;
} {
  let current: Tier = "standard";
  for (const t of TIER_STEPS) if (credits >= t.min) current = t.tier;
  const idx = TIER_STEPS.findIndex((t) => t.tier === current);
  const next = TIER_STEPS[idx + 1];
  const head = TIER_STEPS[idx].headStart;
  if (!next) return { current, toNext: 0, pct: 1, headStart: head };
  const span = next.min - TIER_STEPS[idx].min;
  const into = credits - TIER_STEPS[idx].min;
  return {
    current,
    next: next.tier,
    toNext: next.min - credits,
    pct: Math.min(1, into / span),
    headStart: head,
  };
}

export type CartLine = { productId: string; size: string };

/** A wish the buyer just posted (kept client-side for instant "wish added" feedback). */
export type MyWish = {
  id: string;
  category: string;
  size?: string | null;
  budget?: number | null;
  createdAt: number;
};

/**
 * A Relay (Layer-2) cart line — a Second-Life listing or a Rescue listing the
 * buyer has staged for checkout. Distinct from the Amazon Layer-1 product cart:
 * these reference resale/rescue *listings* (by id), not catalogue products.
 */
export type RelayCartItem = {
  kind: "second_life" | "rescue";
  listingId: string;
  unitId: string;
  title: string;
  imageUrl?: string | null;
  category?: string | null;
  vertical?: string | null;
  price: number;
  grade?: string | null;
  ships?: boolean;
  // Second-Life only: "p2p" | "certified".
  source?: string | null;
};

type Store = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  userId: string;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  co2Kg: number;
  credits: number;
  lockedCredits: number;
  setImpact: (co2: number, credits: number, locked: number) => void;
  addImpact: (co2: number, credits: number) => void;
  claimed: string[];
  claim: (id: string) => void;
  // Amazon Layer-1 local cart (size bracketing demo) — server cart is authoritative on /cart.
  cart: CartLine[];
  addToCart: (item: CartLine) => void;
  removeFromCart: (productId: string, size: string) => void;
  clearExtraSizes: (productId: string, keepSize: string) => void;
  // Relay Layer-2 cart (Second-Life + Rescue resale items) — checked out via
  // POST /orders/relay-checkout into the buyer's Relay order history.
  relayCart: RelayCartItem[];
  addToRelayCart: (item: RelayCartItem) => void;
  removeFromRelayCart: (listingId: string) => void;
  clearRelayCart: () => void;
  // Genie (reverse wishlist) — locally dismissed wishes.
  droppedWishes: string[];
  dropWish: (id: string) => void;
  // Genie — wishes the user just posted, so "wish added" is visible immediately
  // (the backend has no list endpoint; matches arrive async via /wishlist/matches).
  myWishes: MyWish[];
  addMyWish: (w: MyWish) => void;
  removeMyWish: (id: string) => void;
  // Smile transition between Layer-1 (Amazon) and Relay (second-life).
  transitioning: boolean;
  setTransitioning: (v: boolean) => void;
};

export const useRelay = create<Store>((set) => ({
  theme: "light",
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  userId: BUYER_USER_ID,
  persona: "buyer",
  setPersona: (persona) =>
    set({
      persona,
      userId: persona === "seller" ? DEMO_USER_ID : BUYER_USER_ID,
    }),
  co2Kg: 0,
  credits: 0,
  lockedCredits: 0,
  setImpact: (co2, credits, locked) => set({ co2Kg: co2, credits, lockedCredits: locked }),
  addImpact: (co2, credits) =>
    set((s) => ({ co2Kg: +(s.co2Kg + co2).toFixed(1), credits: s.credits + credits })),
  claimed: [],
  claim: (id) => set((s) => ({ claimed: [...s.claimed, id] })),
  cart: [],
  addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
  removeFromCart: (productId, size) =>
    set((s) => ({ cart: s.cart.filter((c) => !(c.productId === productId && c.size === size)) })),
  clearExtraSizes: (productId, keepSize) =>
    set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId || c.size === keepSize) })),
  relayCart: [],
  addToRelayCart: (item) =>
    set((s) =>
      s.relayCart.some((c) => c.listingId === item.listingId)
        ? s
        : { relayCart: [...s.relayCart, item] },
    ),
  removeFromRelayCart: (listingId) =>
    set((s) => ({ relayCart: s.relayCart.filter((c) => c.listingId !== listingId) })),
  clearRelayCart: () => set({ relayCart: [] }),
  droppedWishes: [],
  dropWish: (id) => set((s) => ({ droppedWishes: [...s.droppedWishes, id] })),
  myWishes: [],
  addMyWish: (w) =>
    set((s) => ({ myWishes: [w, ...s.myWishes.filter((x) => x.id !== w.id)].slice(0, 8) })),
  removeMyWish: (id) => set((s) => ({ myWishes: s.myWishes.filter((x) => x.id !== id) })),
  transitioning: false,
  setTransitioning: (v) => set({ transitioning: v }),
}));
