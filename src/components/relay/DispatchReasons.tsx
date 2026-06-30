import {
  AlertTriangle,
  Clock,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";
import type { DispatchReasonDTO } from "@/lib/relay-api";

/**
 * Rescue Dispatch Score reasons (§21.4) — the small "why you're seeing this"
 * chips on a rescue card: best local fit, matches your wish, clearing soon,
 * highest carbon save, etc. Each rescue listing is scored as a (unit × you)
 * edge; these explain the rank so the feed reads as dispatch, not a flat list.
 */

type Style = { icon: typeof Sparkles; tone: "signal" | "relay" | "muted" };

const STYLES: Record<string, Style> = {
  matches_your_wish: { icon: Sparkles, tone: "signal" },
  best_local_fit: { icon: MapPin, tone: "relay" },
  ttl_urgent: { icon: Clock, tone: "signal" },
  price_fit: { icon: Tag, tone: "relay" },
  priced_to_clear: { icon: Tag, tone: "relay" },
  high_carbon_save: { icon: Leaf, tone: "relay" },
  high_keep: { icon: ShieldCheck, tone: "relay" },
  claim_risk: { icon: AlertTriangle, tone: "muted" },
  chain_depth: { icon: AlertTriangle, tone: "muted" },
};

const TONE_VAR: Record<Style["tone"], string | undefined> = {
  signal: "var(--color-signal)",
  relay: "var(--color-relay)",
  muted: undefined,
};

export function DispatchReasons({
  reasons,
  max = 3,
  className = "",
}: {
  reasons?: DispatchReasonDTO[] | null;
  max?: number;
  className?: string;
}) {
  if (!reasons || reasons.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {reasons.slice(0, max).map((r) => {
        const style = STYLES[r.code] ?? { icon: Sparkles, tone: "muted" as const };
        const color = TONE_VAR[style.tone];
        const Icon = style.icon;
        return (
          <span
            key={r.code}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border"
            style={
              color
                ? {
                    color,
                    borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
                    background: `color-mix(in oklab, ${color} 10%, transparent)`,
                  }
                : undefined
            }
          >
            <Icon className="size-2.5" style={color ? { color } : undefined} />
            {r.label}
          </span>
        );
      })}
    </div>
  );
}
