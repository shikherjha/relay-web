import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  Check,
  ArrowLeftRight,
  Zap,
  Lock,
  Globe,
  Truck,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ArrowUpDown,
  Clock3,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pctFraction, productImage } from "@/lib/demo-constants";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { DecayClock } from "@/components/relay/DecayClock";
import { DispatchReasons } from "@/components/relay/DispatchReasons";
import { useRelay } from "@/lib/store";
import {
  getImpact,
  getRescueFeed,
  walletEarlyAccess,
  DEMO_GEO,
  type ImpactWalletDTO,
  type RescueListingDTO,
  type RescueScope,
} from "@/lib/relay-api";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/rescue")({
  head: () => ({
    meta: [
      { title: "Return Rescue — Relay" },
      {
        name: "description",
        content: "Hyperlocal returned items, available to claim before they're routed elsewhere.",
      },
    ],
  }),
  component: Rescue,
});

const FALLBACK_WALLET: ImpactWalletDTO = {
  user_id: "demo",
  total_co2_saved_kg: 47.2,
  credits_balance: 1280,
  locked_credits: 184,
  lifetime_credits: 1464,
  tier: "silver",
  early_access: true,
  early_access_threshold: 100,
  events: [],
};

const SCOPES: { id: RescueScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "local", label: "Near me" },
  { id: "national", label: "National" },
];

type RescueSort = "newest" | "oldest" | "ending";

function returnTime(listing: RescueListingDTO): number {
  return listing.returned_at ? new Date(listing.returned_at).getTime() : 0;
}

function returnedLabel(value?: string | null): string {
  if (!value) return "Return time unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Returned just now";
  if (minutes < 60) return `Returned ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Returned ${hours}h ago`;
  return `Returned ${Math.floor(hours / 24)}d ago`;
}

/** Path A = keep-it-local pickup; Path B = shipped Certified Second-Life. */
function PathBadge({ r }: { r: RescueListingDTO }) {
  const national = r.scope === "national";
  const ships = r.ships || r.fulfillment === "shipped" || r.fulfillment === "courier";
  if (national || ships) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{
          background: "color-mix(in oklab, var(--color-grade-bplus) 16%, transparent)",
          color: "var(--color-grade-bplus)",
        }}
      >
        <Truck className="size-2.5" />{" "}
        {national ? "Certified Second-Life · national" : "Ships to you"}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
        color: "var(--color-relay)",
      }}
    >
      <MapPin className="size-2.5" /> Local pickup
    </span>
  );
}

function Rescue() {
  const userId = useRelay((s) => s.userId);
  const relayCart = useRelay((s) => s.relayCart);
  const addToRelayCart = useRelay((s) => s.addToRelayCart);
  const removeFromRelayCart = useRelay((s) => s.removeFromRelayCart);
  const [scope, setScope] = useState<RescueScope>("all");
  const [sortMode, setSortMode] = useState<RescueSort>("newest");
  const navigate = useNavigate();

  // Pillar 5: green credits buy early access. The tier + embargoed-listing
  // count come live from the backend; the visuals fall back to demo data.
  const { data: wallet = FALLBACK_WALLET } = useQuery({
    queryKey: ["impact", userId],
    queryFn: () => getImpact(FALLBACK_WALLET),
    initialData: FALLBACK_WALLET,
  });
  const { data: live = [] } = useQuery({
    queryKey: ["rescue-feed", userId, scope],
    queryFn: () => getRescueFeed(DEMO_GEO, { scope, fallback: [] }),
  });
  const earlyAccess = walletEarlyAccess(wallet);
  const tierName = wallet.tier ?? (earlyAccess ? "silver" : "standard");
  const embargoedCount = live.filter((l) => l.early_access).length;

  // Dispatch order (§21.4): the backend ranks each listing by its per-viewer
  // dispatch_score (best local fit / wish match / urgency / carbon). We trust
  // that order, falling back to most-recent-return when a score is absent.
  const sorted = [...live].sort((a, b) => {
    if (sortMode === "oldest") return returnTime(a) - returnTime(b);
    if (sortMode === "ending") {
      const aExpiry = a.expires_at ? new Date(a.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
      const bExpiry = b.expires_at ? new Date(b.expires_at).getTime() : Number.MAX_SAFE_INTEGER;
      return aExpiry - bExpiry;
    }
    return returnTime(b) - returnTime(a);
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Return Rescue
          </div>
          <h1 className="font-display text-4xl mt-2">Near you, right now.</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Returned items kept in the loop — claim local pickups nearby, or shipped Certified
            Second-Life pieces from across the country.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> Bangalore · 15km radius
          </div>
          <Link
            to="/rescue/pairs"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition"
          >
            <ArrowLeftRight className="size-4" /> Pair swaps
          </Link>
        </div>
      </div>

      {/* Scope toggle — Path A (local) vs Path B (national/shipped) */}
      <div className="mt-6 inline-flex items-center rounded-full border border-border bg-card p-0.5 text-sm">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${scope === s.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            aria-pressed={scope === s.id}
          >
            {s.id === "national" ? (
              <Globe className="size-3.5" />
            ) : s.id === "local" ? (
              <MapPin className="size-3.5" />
            ) : null}
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpDown className="size-4" />
          <span className="sr-only">Sort rescue listings</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as RescueSort)}
            className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="newest">Latest returns first</option>
            <option value="oldest">Oldest returns first</option>
            <option value="ending">Ending soon</option>
          </select>
        </label>
      </div>

      {/* Pillar 5 flywheel: credits buy early access to this feed. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3"
        style={{
          borderColor: earlyAccess
            ? "color-mix(in oklab, var(--color-signal) 40%, transparent)"
            : "var(--border)",
          background: earlyAccess
            ? "color-mix(in oklab, var(--color-signal) 10%, transparent)"
            : "var(--color-secondary)",
        }}
      >
        {earlyAccess ? (
          <Zap className="size-4 shrink-0" style={{ color: "var(--color-signal)" }} />
        ) : (
          <Lock className="size-4 shrink-0 text-muted-foreground" />
        )}
        <div className="text-sm">
          {earlyAccess ? (
            <>
              <span className="font-medium capitalize" style={{ color: "var(--color-signal)" }}>
                {tierName} tier · early access active.
              </span>{" "}
              <span className="text-muted-foreground">
                You see new rescues before the public
                {embargoedCount > 0
                  ? ` — ${embargoedCount} waiting just for you right now.`
                  : "."}{" "}
              </span>
              <Link to="/impact" className="text-primary hover:underline">
                Why?
              </Link>
            </>
          ) : (
            <span className="text-muted-foreground">
              Rescue items to earn green credits and unlock{" "}
              <span className="text-foreground font-medium">tiered early access</span> — see
              listings before everyone else.{" "}
              <Link to="/impact" className="text-primary hover:underline">
                Your wallet →
              </Link>
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {live.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
            No listings in this scope — try a different scope, or check back soon.
          </p>
        )}
        {sorted.map((r, i) => {
          const inCart = relayCart.some((c) => c.listingId === r.id);
          const basePct = pctFraction(r.base_discount_pct);
          const curPct = pctFraction(r.current_discount_pct);
          const orig = r.original_price ?? 1999;
          const currentPrice = Math.round(orig * (1 - curPct / 100));
          const listPrice = r.list_price ?? currentPrice;
          const ttl = r.ttl_seconds ?? 0;
          const maxPct = pctFraction(r.max_discount_pct ?? 0.45);
          const ships = r.scope === "national" || Boolean(r.ships);
          const pickupAnchored = r.pickup_anchored && r.scope !== "national";
          // Time-decay clock only for local pickup listings that actually carry a
          // TTL + expiry. National / shipped relists have no decay (was wrongly
          // showing a bogus 60-min fallback clock).
          const showClock = !ships && ttl > 0 && Boolean(r.expires_at);
          const openProduct = () =>
            navigate({ to: "/ledger/$unitId", params: { unitId: r.unit_id } });
          const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
          const addToCart = () =>
            addToRelayCart({
              kind: "rescue",
              listingId: r.id,
              unitId: r.unit_id,
              title: r.title ?? "Rescue listing",
              imageUrl: r.image_url ?? null,
              category: r.category,
              vertical: r.vertical,
              price: listPrice,
              grade: r.grade,
              ships,
            });
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 140, damping: 22 }}
              whileHover={{ y: -3 }}
              onClick={openProduct}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProduct();
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={`Open ${r.title ?? "rescue listing"}`}
              className="card-soft overflow-hidden flex flex-col cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <img
                  src={productImage(r.image_url, r.category, r.vertical)}
                  alt={r.title ?? ""}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <GradeBadge grade={(r.grade ?? "A") as Grade} size="sm" />
                </div>
                {r.early_access && (
                  <div
                    className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white"
                    style={{ background: "var(--color-signal)" }}
                  >
                    <Zap className="size-3" /> Early access
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PathBadge r={r} />
                  {pickupAnchored && (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-muted-foreground border border-border">
                      <ShieldCheck className="size-2.5" /> Pickup-anchored
                    </span>
                  )}
                </div>
                {/* Dispatch reasons — why this listing is surfaced for you (§21.4). */}
                <DispatchReasons reasons={r.dispatch_reasons} className="mt-2" />
                <div className="font-medium leading-tight mt-2">{r.title ?? "Rescue listing"}</div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <MapPin className="size-3" />{" "}
                  {r.distance_km != null ? `${r.distance_km} km` : "ships"} · {r.reason ?? "return"}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock3 className="size-3" /> {returnedLabel(r.returned_at)}
                </div>
                {showClock ? (
                  <div className="mt-3">
                    <DecayClock
                      ttlSeconds={ttl}
                      expiresAt={r.expires_at}
                      baseDiscountPct={basePct}
                      maxDiscountPct={maxPct}
                    />
                  </div>
                ) : ships ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground rounded-lg border border-border px-2.5 py-1.5">
                    <Truck className="size-3" /> Ships to you · fixed price (no time decay)
                  </div>
                ) : null}
                <div className="flex items-baseline gap-2 mt-3">
                  <div className="font-display text-xl tabular">
                    ₹{(r.list_price ?? currentPrice).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground line-through tabular">
                    ₹{orig.toLocaleString("en-IN")}
                  </div>
                </div>
                {r.price_range && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" style={{ color: "var(--color-signal)" }} />{" "}
                    AI-priced · range ₹{r.price_range.min.toLocaleString("en-IN")}–₹
                    {r.price_range.max.toLocaleString("en-IN")}
                  </div>
                )}
                <Link
                  to="/ledger/$unitId"
                  params={{ unitId: r.unit_id }}
                  onClick={stop}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  View on-chain history →
                </Link>
                {inCart ? (
                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to="/relay-cart"
                      onClick={stop}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] inline-flex items-center justify-center gap-1.5"
                      style={{
                        background: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
                        color: "var(--color-relay)",
                      }}
                    >
                      <Check className="size-4" /> In cart · review
                    </Link>
                    <button
                      onClick={(e) => {
                        stop(e);
                        removeFromRelayCart(r.id);
                      }}
                      aria-label={`Remove ${r.title ?? "listing"} from cart`}
                      className="py-2.5 px-3 rounded-xl text-sm text-muted-foreground border border-border hover:bg-secondary transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      stop(e);
                      addToCart();
                    }}
                    className="mt-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] bg-primary text-primary-foreground hover:bg-[var(--color-relay-hover)] inline-flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="size-4" />
                    {ships ? "Add to cart · ship to me" : "Add to cart · pickup"}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Don't see what you want?{" "}
        <Link to="/genie" className="text-primary hover:underline">
          Make a wish with Genie →
        </Link>
      </div>
    </div>
  );
}
