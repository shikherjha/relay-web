import { motion } from "framer-motion";
import { Check, Copy, ShieldCheck, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Passport } from "@/lib/mock-data";
import { GradeBadge } from "./GradeBadge";

const sevColor = ["", "#7FB069", "#E8A33D", "#C4502E"];

export function ConditionPassport({ p, compact = false }: { p: Passport; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(p.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.div
      layoutId={`passport-${p.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="card-soft overflow-hidden relative"
      style={{ background: "linear-gradient(180deg, var(--color-card) 0%, color-mix(in oklab, var(--color-card) 92%, var(--color-relay)) 100%)" }}
    >
      {/* perforation strip */}
      <div className="absolute left-0 top-0 bottom-0 w-6 border-r border-dashed border-border/80 flex flex-col justify-around items-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="size-1 rounded-full bg-border" />
        ))}
      </div>

      <div className="pl-10 pr-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Condition Passport</div>
            <h3 className="font-display text-xl mt-1 leading-tight">{p.itemName}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">{p.category} · {p.packaging} packaging</div>
          </div>
          <GradeBadge grade={p.grade} size="lg" confidence={p.confidence} />
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-4 mt-5">
          <div className="relative rounded-lg overflow-hidden bg-secondary aspect-square">
            <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
            {p.defects.filter(d => d.x && d.y).map((d, i) => (
              <div key={i}
                className="absolute size-3 rounded-full border-2 border-white shadow"
                style={{ left: `${d.x}%`, top: `${d.y}%`, background: sevColor[d.severity], transform: "translate(-50%,-50%)" }}
              />
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">AI grader note</div>
            <p className="text-sm leading-relaxed">{p.graderNote}</p>
            {p.defects.length > 0 ? (
              <div className="pt-1 space-y-1">
                {p.defects.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="size-1.5 rounded-full" style={{ background: sevColor[d.severity] }} />
                    <span className="text-foreground/80">{d.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs flex items-center gap-1.5 text-primary"><Check className="size-3.5" /> No defects detected</div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t border-dashed border-border">
          <button onClick={copy} className="flex items-center gap-2 text-xs font-mono bg-secondary px-2.5 py-1.5 rounded-md hover:bg-secondary/70 transition-colors">
            <span className="text-muted-foreground">hash</span>
            <span>{p.hash.slice(0, 8)}…{p.hash.slice(-4)}</span>
            {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3 opacity-60" />}
          </button>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="size-5 rounded-full flex items-center justify-center" style={{ background: "color-mix(in oklab, var(--color-primary) 12%, transparent)" }}>
              <ShieldCheck className="size-3 text-primary" />
            </div>
            <span className="text-muted-foreground">Verified on LifeLedger</span>
          </div>
        </div>

        {!compact && (
          <Link
            to="/ledger/$unitId"
            params={{ unitId: p.unitId }}
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all font-medium"
          >
            View on-chain history <ChevronRight className="size-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}