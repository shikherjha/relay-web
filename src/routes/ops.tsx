import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Layers, Leaf, ShieldAlert, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { opsHighReturnSkus, opsSellerSignals, opsChainDepth, opsImpact, rescueLive, channelMeta, type DispositionChannel } from "@/lib/mock-extra";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { DecayClock } from "@/components/relay/DecayClock";
import { AnimatedCounter } from "@/components/relay/AnimatedCounter";
import {
  getHighReturnSkus, getSellerSignals, getChainDepth, getOpsImpact,
  type HighReturnSkuDTO, type ChainDepthRowDTO, type OpsImpactDTO,
} from "@/lib/relay-api";

export const Route = createFileRoute("/ops")({
  head: () => ({ meta: [{ title: "Ops — Relay" }, { name: "description", content: "Seller and operations control room for Relay." }] }),
  component: OpsPage,
});

const CHAIN_CAP = 3; // relay-api chain_depth_cap

const FALLBACK_SKUS: HighReturnSkuDTO[] = opsHighReturnSkus.map((r) => ({
  sku: r.sku, title: r.title, return_count: r.return_count, total_sold: null,
  return_rate: r.return_rate, dominant_reason: r.dominant_reason, recommendation: null,
}));
const FALLBACK_SIGNALS: HighReturnSkuDTO[] = opsSellerSignals.map((s) => ({
  sku: s.sku, title: null, return_count: 0, total_sold: null,
  return_rate: s.return_rate, dominant_reason: s.primary_reason, recommendation: s.recommendation,
}));
const FALLBACK_CHAIN: ChainDepthRowDTO[] = opsChainDepth.map((u) => ({
  unit_id: u.unit_id, transfer_count: u.transfer_count, forced_channel: u.forced_channel,
}));
const FALLBACK_IMPACT: OpsImpactDTO = opsImpact;

function OpsPage() {
  const { data: skus } = useQuery({ queryKey: ["ops-skus"], queryFn: () => getHighReturnSkus(FALLBACK_SKUS), initialData: FALLBACK_SKUS });
  const { data: signals } = useQuery({ queryKey: ["ops-signals"], queryFn: () => getSellerSignals(FALLBACK_SIGNALS), initialData: FALLBACK_SIGNALS });
  const { data: chain } = useQuery({ queryKey: ["ops-chain"], queryFn: () => getChainDepth(FALLBACK_CHAIN), initialData: FALLBACK_CHAIN });
  const { data: impact } = useQuery({ queryKey: ["ops-impact"], queryFn: () => getOpsImpact(FALLBACK_IMPACT), initialData: FALLBACK_IMPACT });
  return (
    <div className="mx-auto max-w-[1320px] px-6 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ops · seller console</div>
          <h1 className="font-display text-4xl mt-2">Control room</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">Where catalog health, live rescues, and chain integrity meet. Built for sellers and ops leads.</p>
        </div>

        <div className="card-soft p-4 min-w-[260px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Net impact · last 30 days</div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <div className="font-display text-2xl tabular flex items-baseline gap-1">
                <AnimatedCounter value={impact.total_co2_saved_kg} decimals={1} />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
              <div className="text-[11px] text-muted-foreground">CO₂ saved</div>
            </div>
            <div>
              <div className="font-display text-2xl tabular"><AnimatedCounter value={impact.rescued_units} /></div>
              <div className="text-[11px] text-muted-foreground">Units rescued</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-10">
        {/* High-return SKUs */}
        <Panel title="High-return SKUs" icon={<TrendingDown className="size-4" />} className="lg:col-span-2">
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-medium">SKU</th>
                  <th className="px-2 py-2 font-medium">Title</th>
                  <th className="px-2 py-2 font-medium text-right">Returns</th>
                  <th className="px-2 py-2 font-medium text-right">Rate</th>
                  <th className="px-2 py-2 font-medium">Top reason</th>
                </tr>
              </thead>
              <tbody>
                {skus.map((r) => (
                  <tr key={r.sku} className="border-t border-border/70">
                    <td className="px-2 py-3 font-mono text-xs">{r.sku}</td>
                    <td className="px-2 py-3">{r.title ?? "—"}</td>
                    <td className="px-2 py-3 text-right tabular">{r.return_count}</td>
                    <td className="px-2 py-3 text-right tabular">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.return_rate > 0.2 ? "text-[var(--color-grade-c)]" : "text-foreground"}`} style={{ background: r.return_rate > 0.2 ? "color-mix(in oklab, var(--color-grade-c) 14%, transparent)" : "var(--color-secondary)" }}>
                        {(r.return_rate * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{r.dominant_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Chain-depth watch */}
        <Panel title="Chain-depth watch" icon={<Layers className="size-4" />}>
          <div className="space-y-2">
            {chain.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">No units in transfer yet.</div>
            )}
            {chain.map((u) => {
              const overCap = u.transfer_count >= CHAIN_CAP;
              const forced = u.forced_channel as DispositionChannel | null;
              return (
                <Link key={u.unit_id} to="/ledger/$unitId" params={{ unitId: u.unit_id }} className={`flex items-center justify-between gap-3 rounded-xl p-3 transition ${overCap ? "border border-[var(--color-grade-c)]/40 bg-[color-mix(in_oklab,var(--color-grade-c)_8%,transparent)]" : "bg-secondary/40 hover:bg-secondary"}`}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate font-mono">{u.unit_id.slice(0, 13)}</div>
                    <div className="text-[11px] text-muted-foreground">{overCap ? "chain cap reached" : "in circulation"}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm tabular font-medium ${overCap ? "text-[var(--color-grade-c)]" : ""}`}>{u.transfer_count}/{CHAIN_CAP}</div>
                    {forced && channelMeta[forced] && (
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">→ {channelMeta[forced].name}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        {/* Seller signals */}
        <Panel title="Catalog-fix recommendations" icon={<AlertTriangle className="size-4" />} className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            {signals.length === 0 && (
              <div className="text-xs text-muted-foreground py-4 col-span-full text-center">No SKUs above the return-rate threshold yet.</div>
            )}
            {signals.map((s, i) => (
              <motion.div key={s.sku} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-xs">{s.sku}</div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: "var(--color-grade-c)", background: "color-mix(in oklab, var(--color-grade-c) 14%, transparent)" }}>
                    {(s.return_rate * 100).toFixed(0)}% returns
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">Primary reason: {s.dominant_reason ?? "—"}</div>
                <p className="text-sm mt-2 leading-relaxed">{s.recommendation}</p>
                <button className="mt-3 text-xs font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
                  Apply fix <ArrowUpRight className="size-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </Panel>

        {/* Items in rescue live */}
        <Panel title="Items in rescue · live" icon={<Leaf className="size-4" />}>
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {rescueLive.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-3 bg-card">
                <div className="flex items-start gap-3">
                  <img src={r.image} alt="" className="size-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{r.reason}</div>
                  </div>
                  <GradeBadge grade={r.grade} size="sm" />
                </div>
                <div className="mt-2">
                  <DecayClock ttlSeconds={r.ttl_seconds} baseDiscountPct={r.base_discount_pct} maxDiscountPct={r.max_discount_pct} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-8 text-center text-xs text-muted-foreground inline-flex items-center gap-1.5 justify-center w-full">
        <ShieldAlert className="size-3" /> Guardrails active · chain depth cap = 4 · 14-day keep period on rescues
      </div>
    </div>
  );
}

function Panel({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-soft p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="size-7 rounded-lg bg-secondary flex items-center justify-center text-foreground/70">{icon}</span>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}