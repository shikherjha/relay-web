import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Check, ShieldAlert, ArrowLeftRight, Zap, Lock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoryImage, pctFraction } from "@/lib/demo-constants";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { DecayClock } from "@/components/relay/DecayClock";
import { useRelay } from "@/lib/store";
import { claimRescue, getImpact, getRescueFeed, DEMO_GEO, type ImpactWalletDTO } from "@/lib/relay-api";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/rescue")({
  head: () => ({ meta: [{ title: "Return Rescue — Relay" }, { name: "description", content: "Hyperlocal returned items, available to claim before they're routed elsewhere." }] }),
  component: Rescue,
});

const FALLBACK_WALLET: ImpactWalletDTO = {
  user_id: "demo", total_co2_saved_kg: 47.2, credits_balance: 1280, locked_credits: 184,
  lifetime_credits: 1464, early_access: true, early_access_threshold: 100, events: [],
};

function Rescue() {
  const { claimed, claim, addImpact, userId } = useRelay();
  const [blocked, setBlocked] = useState<Record<string, string[]>>({});

  // Pillar 5: green credits buy early access. The tier + embargoed-listing
  // count come live from the backend; the visuals fall back to demo data.
  const { data: wallet } = useQuery({
    queryKey: ["impact", userId], queryFn: () => getImpact(FALLBACK_WALLET), initialData: FALLBACK_WALLET,
  });
  const { data: live = [] } = useQuery({
    queryKey: ["rescue-feed", userId],
    queryFn: () => getRescueFeed(DEMO_GEO, []),
  });
  const earlyAccess = wallet.early_access;
  const embargoedCount = live.filter((l) => l.early_access).length;

  const onClaim = async (id: string) => {
    try {
      const res = await claimRescue(id);
      if (!res.claimed) {
        setBlocked((b) => ({ ...b, [id]: res.guardrails_applied }));
        return;
      }
      claim(id);
      addImpact(2.4, 0);
    } catch (e) {
      console.error(e);
      setBlocked((b) => ({ ...b, [id]: ["API unavailable"] }));
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Return Rescue</div>
          <h1 className="font-display text-4xl mt-2">Near you, right now.</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">Items returned within 5km. Claim to keep them in your neighborhood instead of a warehouse return loop.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" /> Bangalore · 15km radius
          </div>
          <Link to="/rescue/pairs" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 rounded-full px-3 py-1.5 hover:bg-primary/10 transition">
            <ArrowLeftRight className="size-4" /> Pair swaps
          </Link>
        </div>
      </div>

      {/* Pillar 5 flywheel: credits buy early access to this feed. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3"
        style={{
          borderColor: earlyAccess ? "color-mix(in oklab, var(--color-signal) 40%, transparent)" : "var(--border)",
          background: earlyAccess ? "color-mix(in oklab, var(--color-signal) 10%, transparent)" : "var(--color-secondary)",
        }}
      >
        {earlyAccess ? <Zap className="size-4 shrink-0" style={{ color: "var(--color-signal)" }} /> : <Lock className="size-4 shrink-0 text-muted-foreground" />}
        <div className="text-sm">
          {earlyAccess ? (
            <>
              <span className="font-medium" style={{ color: "var(--color-signal)" }}>Early access active.</span>{" "}
              <span className="text-muted-foreground">
                You see new rescues 10 minutes before the public
                {embargoedCount > 0 ? ` — ${embargoedCount} waiting just for you right now.` : "."}{" "}
              </span>
              <Link to="/impact" className="text-primary hover:underline">Why?</Link>
            </>
          ) : (
            <span className="text-muted-foreground">
              Rescue items to earn green credits and unlock <span className="text-foreground font-medium">early access</span> — see listings before everyone else.{" "}
              <Link to="/impact" className="text-primary hover:underline">Your wallet →</Link>
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        {live.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
            No listings — reset demo (↻) or switch to <strong>seller</strong> for early access.
          </p>
        )}
        {live.map((r, i) => {
          const isClaimed = claimed.includes(r.id) || r.status === "claimed";
          const guardrails = blocked[r.id];
          const basePct = pctFraction(r.base_discount_pct);
          const curPct = pctFraction(r.current_discount_pct);
          const orig = r.original_price ?? 1999;
          const currentPrice = Math.round(orig * (1 - curPct / 100));
          const ttl = r.ttl_seconds ?? 3600;
          const maxPct = pctFraction(r.max_discount_pct ?? 0.45);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 140, damping: 22 }}
              whileHover={{ y: -3 }}
              className="card-soft overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <img src={categoryImage(r.category, r.vertical)} alt={r.title ?? ""} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3"><GradeBadge grade={(r.grade ?? "A") as Grade} size="sm" /></div>
                {r.early_access && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white" style={{ background: "var(--color-signal)" }}>
                    <Zap className="size-3" /> Early access
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="font-medium leading-tight">{r.title ?? "Rescue listing"}</div>
                <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {r.distance_km ?? "—"} km · {r.reason ?? "return"}
                </div>
                <div className="mt-3">
                  <DecayClock ttlSeconds={ttl} baseDiscountPct={basePct} maxDiscountPct={maxPct} />
                </div>
                <div className="flex items-baseline gap-2 mt-3">
                  <div className="font-display text-xl tabular">₹{currentPrice.toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted-foreground line-through tabular">₹{orig.toLocaleString("en-IN")}</div>
                </div>
                <Link to="/ledger/$unitId" params={{ unitId: r.unit_id }} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                  View on-chain history →
                </Link>
                <button
                  disabled={isClaimed}
                  onClick={() => onClaim(r.id)}
                  className={`mt-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                    isClaimed
                      ? "bg-secondary text-muted-foreground cursor-default"
                      : guardrails
                      ? "bg-secondary text-muted-foreground"
                      : "bg-primary text-primary-foreground hover:bg-[var(--color-relay-hover)]"
                  }`}
                >
                  {isClaimed ? <span className="inline-flex items-center gap-1.5"><Check className="size-4" /> Claimed</span> : "Claim · keep it local"}
                </button>
                {guardrails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 text-xs text-muted-foreground rounded-lg px-3 py-2"
                    style={{ background: "color-mix(in oklab, var(--color-signal) 12%, transparent)" }}
                  >
                    <div className="inline-flex items-center gap-1.5 font-medium"><ShieldAlert className="size-3" /> Not eligible right now</div>
                    <div className="mt-1">{guardrails.join(" · ")}</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Don't see what you want? <Link to="/wishlist" className="text-primary hover:underline">Post a reverse wishlist →</Link>
      </div>
    </div>
  );
}