import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Leaf, Sparkles, Lock, TreePine, Zap, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/relay/AnimatedCounter";
import { getImpact, type ImpactWalletDTO } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/impact")({
  head: () => ({ meta: [{ title: "Impact Wallet — Relay" }, { name: "description", content: "Your second-life footprint and green credit balance." }] }),
  component: ImpactPage,
});

// Curated demo wallet — used only if the backend is unreachable.
const FALLBACK_WALLET: ImpactWalletDTO = {
  user_id: "demo",
  total_co2_saved_kg: 47.2,
  credits_balance: 1280,
  locked_credits: 184,
  lifetime_credits: 1464,
  early_access: true,
  early_access_threshold: 100,
  events: [],
};

const activity = [
  { id: "i1", channel: "Hyperlocal Rescue", co2: 2.4, at: "2026-06-10", note: "Levi's 511 · claimed locally" },
  { id: "i2", channel: "Exchange",          co2: 1.8, at: "2026-06-07", note: "Sony XM5 · size swap" },
  { id: "i3", channel: "Refurbish",         co2: 3.1, at: "2026-05-29", note: "Filson Field Jacket" },
  { id: "i4", channel: "Peer-to-Peer",      co2: 2.0, at: "2026-05-21", note: "Uniqlo U Tee" },
  { id: "i5", channel: "Donate",            co2: 1.2, at: "2026-05-14", note: "3 items routed to Goonj" },
];

function ImpactPage() {
  const userId = useRelay((s) => s.userId);
  const { data: wallet } = useQuery({
    queryKey: ["impact", userId],
    queryFn: () => getImpact(FALLBACK_WALLET),
    initialData: FALLBACK_WALLET,
  });
  const co2Kg = wallet.total_co2_saved_kg;
  const credits = wallet.credits_balance;
  const lockedCredits = wallet.locked_credits;
  const lifetime = wallet.lifetime_credits;
  const threshold = wallet.early_access_threshold || 100;
  const hasEarlyAccess = wallet.early_access;
  const toNext = Math.max(0, threshold - lifetime);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impact Wallet</div>
      <h1 className="font-display text-4xl mt-2">Your second-life footprint</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">Every rescued item saves ~2.4 kg CO₂ vs a warehouse return cycle. Your credits don't buy discounts — they buy <span className="text-foreground font-medium">a better position inside the loop</span>.</p>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 mt-10">
        {/* CO2 hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120 }}
          className="card-soft p-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--color-card), color-mix(in oklab, var(--color-card) 80%, var(--color-relay)))" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">CO₂ saved</div>
              <div className="font-display text-6xl mt-3 tabular leading-none">
                <AnimatedCounter value={co2Kg} decimals={1} /> <span className="text-2xl text-muted-foreground">kg</span>
              </div>
              <div className="text-sm text-muted-foreground mt-3">≈ {Math.round(co2Kg / 21)} mature trees absorbing CO₂ for a year.</div>
            </div>
            <div className="relative">
              <TreePine className="size-24" style={{ color: "var(--color-relay)" }} />
              <Leaf className="absolute -top-2 -right-2 size-6" style={{ color: "var(--color-grade-bplus)" }} />
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
          {/* Early-access tier — the flywheel */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card-soft p-6 relative overflow-hidden"
            style={{ background: hasEarlyAccess ? "linear-gradient(135deg, var(--color-card), color-mix(in oklab, var(--color-signal) 14%, var(--color-card)))" : undefined }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Zap className="size-3.5" style={{ color: "var(--color-signal)" }} /> Rescue early access
            </div>
            {hasEarlyAccess ? (
              <>
                <div className="font-display text-2xl mt-2 inline-flex items-center gap-2" style={{ color: "var(--color-signal)" }}>
                  <Check className="size-5" /> Unlocked
                </div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  You see new rescue listings <span className="text-foreground font-medium">10 minutes before everyone else</span> — a real edge on decay-priced items.
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-2xl mt-2">{toNext} credits to go</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Rescue {toNext > 0 ? "a few more items" : "more items"} to unlock early access to the feed.
                </div>
              </>
            )}
            <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full" style={{ width: `${Math.min(100, (lifetime / threshold) * 100)}%`, background: "var(--color-signal)" }} />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5 tabular">
              {lifetime.toFixed(0)} lifetime credits · tier at {threshold}
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-soft p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5" style={{ color: "var(--color-signal)" }} /> Spendable
              </div>
              <div className="font-display text-3xl tabular mt-2" style={{ color: "var(--color-signal)" }}>
                <AnimatedCounter value={credits} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-soft p-5 border-dashed">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Lock className="size-3.5" /> Locked · 14d
              </div>
              <div className="font-display text-3xl tabular mt-2"><AnimatedCounter value={lockedCredits} /></div>
            </motion.div>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl mb-4">Recent activity</h2>
        <div className="card-soft divide-y divide-border">
          {activity.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full flex items-center justify-center" style={{ background: "color-mix(in oklab, var(--color-primary) 12%, transparent)" }}>
                  <Leaf className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">{a.channel}</div>
                  <div className="text-xs text-muted-foreground">{a.note} · {a.at}</div>
                </div>
              </div>
              <div className="text-sm tabular font-medium" style={{ color: "var(--color-relay)" }}>+{a.co2.toFixed(1)} kg</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-2xl tabular"><AnimatedCounter value={value} /></div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}