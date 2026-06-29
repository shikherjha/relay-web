import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import type {
  ConfidenceBand,
  ConfidenceDriver,
  ConfidenceIntervention,
  ReturnConfidenceDTO,
} from "@/lib/relay-api";

/**
 * Return Confidence (Track D §21.1) — a non-punitive purchase-keep signal.
 *
 * Customer copy is confidence-building, never "you are likely to return this".
 * It always leads with the recommended ACTION (intervention), not just a warning.
 */

const BAND: Record<
  ConfidenceBand,
  { token: string; label: string; Icon: typeof ShieldCheck }
> = {
  high: { token: "--color-relay", label: "Buy with confidence", Icon: ShieldCheck },
  medium: { token: "--color-signal", label: "One tweak helps", Icon: Sparkles },
  low: { token: "--color-destructive", label: "Let's get the right one", Icon: AlertTriangle },
};

function driverColor(d: ConfidenceDriver): string {
  if (d.positive) return "var(--color-relay)";
  if (d.severity === "high") return "var(--color-destructive)";
  if (d.severity === "medium") return "var(--color-signal)";
  return "var(--color-muted-foreground)";
}

function isActionable(iv: ConfidenceIntervention, variant: "cart" | "pdp"): boolean {
  if (iv.action === "remove_extra_sizes") return variant === "cart";
  if (iv.type === "size_recommendation" && iv.suggested_size) return variant === "pdp";
  return false;
}

export function ReturnConfidence({
  data,
  variant = "cart",
  onApplyIntervention,
  busy = false,
  className = "",
}: {
  data: ReturnConfidenceDTO;
  variant?: "cart" | "pdp";
  onApplyIntervention?: (iv: ConfidenceIntervention) => void;
  busy?: boolean;
  className?: string;
}) {
  const meta = BAND[data.confidence_band];
  const token = meta.token;
  const pct = Math.round(data.keep_score * 100);
  const Icon = meta.Icon;
  const compact = variant === "pdp";

  const actions = data.interventions.filter((iv) => isActionable(iv, variant));
  const notes = data.interventions.filter((iv) => !isActionable(iv, variant));

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${className}`}
      style={{
        borderColor: `color-mix(in oklab, var(${token}) 35%, transparent)`,
        background: `color-mix(in oklab, var(${token}) 7%, transparent)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="size-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklab, var(${token}) 16%, transparent)` }}
        >
          <Icon className="size-4" style={{ color: `var(${token})` }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div
              className="text-[11px] uppercase tracking-wider font-medium"
              style={{ color: `var(${token})` }}
            >
              Return Confidence · {meta.label}
              {data.for_self === false && (
                <span className="normal-case text-muted-foreground"> · for {data.profile_name}</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground tabular">{pct}% keep</div>
          </div>

          {/* Keep-score meter */}
          <div className="mt-1.5 h-1.5 rounded-full bg-border/60 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `var(${token})` }}
            />
          </div>

          <p className={`mt-2 leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
            {data.headline}
          </p>

          {/* Drivers — neutral "why" chips */}
          {data.drivers.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {data.drivers.map((d, i) => (
                <span
                  key={`${d.type}-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11px]"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: driverColor(d) }}
                  />
                  {d.label}
                </span>
              ))}
            </div>
          )}

          {/* Interventions — the recommended ACTION leads */}
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((iv, i) => (
                <button
                  key={`${iv.type}-${i}`}
                  type="button"
                  onClick={() => onApplyIntervention?.(iv)}
                  disabled={busy || !onApplyIntervention}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] disabled:opacity-50"
                  style={{ background: `var(${token})`, color: "var(--color-signal-foreground, #0F1111)" }}
                >
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {iv.label}
                </button>
              ))}
            </div>
          )}

          {/* Non-actionable interventions render as supportive notes */}
          {notes.length > 0 && (
            <div className="mt-2 space-y-1">
              {notes.map((iv, i) => (
                <div
                  key={`${iv.type}-${i}`}
                  className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                >
                  <ArrowRight className="size-3 mt-0.5 shrink-0" style={{ color: `var(${token})` }} />
                  <span>{iv.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
