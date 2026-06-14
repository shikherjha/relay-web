import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeftRight, MapPin, Sparkles, ArrowLeft } from "lucide-react";
import { categoryImage } from "@/lib/demo-constants";
import { getPairMatches } from "@/lib/relay-api";
import { GradeBadge } from "@/components/relay/GradeBadge";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/rescue/pairs")({
  head: () => ({ meta: [{ title: "Pair Rescue — Relay" }, { name: "description", content: "Circular swaps near you." }] }),
  component: PairsPage,
});

function PairsPage() {
  const { data: pairs = [] } = useQuery({
    queryKey: ["pair-matches"],
    queryFn: () => getPairMatches([]),
  });

  const titleForUnit = (unitId: string) => {
    if (unitId.startsWith("00000000-0000-0000-0000-0000000000b1")) return "Fleece Hoodie · M";
    if (unitId.startsWith("00000000-0000-0000-0000-0000000000b2")) return "Slim Fit Jeans · 32";
    return `Unit ${unitId.slice(-4)}`;
  };

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12">
      <Link to="/rescue" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="size-3" /> Back to Rescue
      </Link>
      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pair Rescue</div>
        <h1 className="font-display text-4xl mt-2">Circular swaps near you</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Bipartite match: A's return satisfies B's wish and vice versa.</p>
      </div>

      {pairs.length === 0 && (
        <p className="text-sm text-muted-foreground mt-10">No pairs found — reset demo and ensure both users have wishes + returned units.</p>
      )}

      <div className="space-y-6 mt-10">
        {pairs.map((pm, i) => (
          <motion.div key={`${pm.unit_a}-${pm.unit_b}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} className="card-soft p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                style={{ background: "color-mix(in oklab, var(--color-signal) 18%, transparent)", color: "var(--color-signal)" }}>
                <Sparkles className="size-3" /> {Math.round(pm.score * 100)}% match
              </span>
              <span className="text-muted-foreground text-xs inline-flex items-center gap-1">
                <MapPin className="size-3" /> {pm.distance_km?.toFixed(1) ?? "—"} km
              </span>
            </div>
            <div className="grid md:grid-cols-[1fr_auto_1fr] items-center gap-5">
              <UnitCard unitId={pm.unit_a} title={titleForUnit(pm.unit_a)} side="A" />
              <div className="hidden md:flex size-14 rounded-full bg-primary text-primary-foreground items-center justify-center">
                <ArrowLeftRight className="size-6" />
              </div>
              <UnitCard unitId={pm.unit_b} title={titleForUnit(pm.unit_b)} side="B" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function UnitCard({ unitId, title, side }: { unitId: string; title: string; side: string }) {
  return (
    <Link to="/ledger/$unitId" params={{ unitId }} className="block group">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="relative aspect-[4/3] bg-secondary">
          <img src={categoryImage(title.includes("Jeans") ? "jeans" : "hoodie")} alt={title} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3"><GradeBadge grade={"A" as Grade} size="sm" /></div>
          <div className="absolute top-3 right-3 size-7 rounded-full bg-card border flex items-center justify-center text-[11px] font-mono">{side}</div>
        </div>
        <div className="p-3">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{unitId.slice(0, 13)}…</div>
        </div>
      </div>
    </Link>
  );
}
