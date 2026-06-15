import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Leaf, Sparkles, Lock, TreePine, Crown, ArrowRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/relay/AnimatedCounter";
import { BuyerActivity } from "@/components/relay/BuyerActivity";
import {
  getImpact,
  walletEarlyAccess,
  type ImpactTierDTO,
  type ImpactWalletDTO,
} from "@/lib/relay-api";
import { TIER_STEPS, tierFor, useRelay } from "@/lib/store";

export const Route = createFileRoute("/impact")({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Impact Wallet — Relay" },
      { name: "description", content: "Your second-life footprint and green credit balance." },
    ],
  }),
  component: ImpactPage,
});

// Curated demo wallet — used only if the backend is unreachable.
const FALLBACK_WALLET: ImpactWalletDTO = {
  user_id: "demo",
  total_co2_saved_kg: 47.2,
  credits_balance: 1280,
  locked_credits: 184,
  lifetime_credits: 1464,
  tier: "silver",
  next_tier: "gold",
  credits_to_next_tier: 1220,
  tiers: [
    { name: "standard", threshold: 0, early_access_hours: 0, unlocked: true },
    { name: "silver", threshold: 1000, early_access_hours: 3, unlocked: true },
    { name: "gold", threshold: 2500, early_access_hours: 24, unlocked: false },
  ],
  early_access: true,
  early_access_threshold: 100,
  events: [],
};

const tierColor: Record<string, string> = {
  standard: "var(--color-grade-bplus)",
  silver: "#9AA5A0",
  gold: "var(--color-signal)",
};

function ImpactPage() {
  const { tab } = Route.useSearch();
  const userId = useRelay((s) => s.userId);
  const { data: wallet = FALLBACK_WALLET } = useQuery({
    queryKey: ["impact", userId],
    queryFn: () => getImpact(FALLBACK_WALLET),
    initialData: FALLBACK_WALLET,
  });

  const co2Kg = wallet.total_co2_saved_kg;
  const credits = wallet.credits_balance;
  const lockedCredits = wallet.locked_credits;
  const lifetime = wallet.lifetime_credits ?? credits;

  // Prefer the backend tier ladder; fall back to the local one if absent.
  const local = tierFor(lifetime);
  const tiers: ImpactTierDTO[] =
    wallet.tiers && wallet.tiers.length
      ? wallet.tiers
      : TIER_STEPS.map((t) => ({
          name: t.tier,
          threshold: t.min,
          early_access_hours: t.tier === "gold" ? 24 : t.tier === "silver" ? 3 : 0,
          unlocked: lifetime >= t.min,
        }));
  const currentTier = (wallet.tier ?? local.current).toString();
  const nextTier = wallet.next_tier ?? local.next ?? null;
  const toNext = wallet.credits_to_next_tier ?? local.toNext;
  const earlyAccess = walletEarlyAccess(wallet);

  // Progress to next tier from thresholds.
  const curThreshold = tiers.find((t) => t.name === currentTier)?.threshold ?? 0;
  const nextThreshold = nextTier
    ? (tiers.find((t) => t.name === nextTier)?.threshold ?? curThreshold)
    : curThreshold;
  const pct =
    nextTier && nextThreshold > curThreshold
      ? Math.min(1, (lifetime - curThreshold) / (nextThreshold - curThreshold))
      : 1;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impact Wallet</div>
      <h1 className="font-display text-4xl mt-2">Your second-life footprint</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Every rescued item saves ~2.4 kg CO₂ vs a warehouse return cycle. Your credits don't buy
        discounts — they buy{" "}
        <span className="text-foreground font-medium">a better position inside the loop</span>.
      </p>

      {/* Tier card — early access flywheel, driven by the impact API tiers[] */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-8 card-soft p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(110deg, var(--color-card) 60%, color-mix(in oklab, var(--color-card) 78%, ${tierColor[currentTier] ?? "var(--color-relay)"}))`,
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="size-14 rounded-2xl flex items-center justify-center text-white"
              style={{ background: tierColor[currentTier] ?? "var(--color-relay)" }}
            >
              <Crown className="size-7" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Early-access tier
              </div>
              <div className="font-display text-2xl mt-1 capitalize">{currentTier}</div>
              {earlyAccess && (
                <div
                  className="text-sm mt-0.5 inline-flex items-center gap-1.5"
                  style={{ color: "var(--color-signal)" }}
                >
                  <Zap className="size-3.5" /> Early access active
                </div>
              )}
            </div>
          </div>
          <Link
            to="/rescue"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition"
          >
            Browse early-access rescues <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* tier ladder */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {tiers.map((step) => {
            const isCurrent = currentTier === step.name;
            return (
              <div
                key={step.name}
                className={`rounded-xl p-3 border ${isCurrent ? "border-foreground" : "border-border"} ${step.unlocked ? "bg-card" : "bg-secondary/40 opacity-70"}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: tierColor[step.name] ?? "var(--color-relay)" }}
                  />
                  <span className="text-sm font-medium capitalize">{step.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider text-primary">you</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  {step.early_access_hours > 0
                    ? `${step.early_access_hours}h early access`
                    : "Public listings"}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 tabular">
                  {step.threshold}+ credits
                </div>
              </div>
            );
          })}
        </div>

        {nextTier && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Progress to <span className="capitalize">{nextTier}</span>
              </span>
              <span className="tabular font-medium">{toNext} credits to go</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full"
                style={{ background: tierColor[nextTier] ?? "var(--color-signal)" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 mt-10">
        {/* CO2 hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="card-soft p-8 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--color-card), color-mix(in oklab, var(--color-card) 80%, var(--color-relay)))",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                CO₂ saved
              </div>
              <div className="font-display text-6xl mt-3 tabular leading-none">
                <AnimatedCounter value={co2Kg} decimals={1} />{" "}
                <span className="text-2xl text-muted-foreground">kg</span>
              </div>
              <div className="text-sm text-muted-foreground mt-3">
                ≈ {Math.round(co2Kg / 21)} mature trees absorbing CO₂ for a year.
              </div>
            </div>
            <div className="relative">
              <TreePine className="size-24" style={{ color: "var(--color-relay)" }} />
              <Leaf
                className="absolute -top-2 -right-2 size-6"
                style={{ color: "var(--color-grade-bplus)" }}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-dashed border-border/70">
            <Mini label="Items helped" value={47} />
            <Mini label="Local routes" value={28} />
            <Mini label="Warehouse cycles avoided" value={31} />
          </div>
        </motion.div>

        {/* Credits = access, not discounts */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-soft p-5"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5" style={{ color: "var(--color-signal)" }} /> Spendable
              </div>
              <div
                className="font-display text-3xl tabular mt-2"
                style={{ color: "var(--color-signal)" }}
              >
                <AnimatedCounter value={credits} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-soft p-5 border-dashed"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Lock className="size-3.5" /> Locked · 14d
              </div>
              <div className="font-display text-3xl tabular mt-2">
                <AnimatedCounter value={lockedCredits} />
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-soft p-5"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Lifetime credits
            </div>
            <div className="font-display text-2xl tabular mt-1">
              <AnimatedCounter value={lifetime} />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Lifetime total drives your early-access tier.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Live tracking — orders, returns (to their next home), and resells. */}
      <BuyerActivity defaultTab={tab} />
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-2xl tabular">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
