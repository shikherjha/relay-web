import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function remainingFrom(expiresAt: string | null | undefined, ttlSeconds: number): number {
  if (expiresAt) {
    const secs = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    if (Number.isFinite(secs)) return Math.max(0, Math.min(secs, ttlSeconds));
  }
  return ttlSeconds;
}

/** Pretty "Nh Mm" / "Mm Ss" for long (multi-hour) and short windows alike. */
function fmt(remaining: number): string {
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m left`;
  return `${m}m ${s.toString().padStart(2, "0")}s left`;
}

export function DecayClock({
  ttlSeconds,
  baseDiscountPct,
  maxDiscountPct,
  expiresAt,
}: {
  ttlSeconds: number;
  baseDiscountPct: number;
  maxDiscountPct: number;
  /** Absolute expiry from the backend — drives the real countdown if present. */
  expiresAt?: string | null;
}) {
  const totalRef = useState(() => Math.max(ttlSeconds, 60))[0];
  const [remaining, setRemaining] = useState(() => remainingFrom(expiresAt, totalRef));
  useEffect(() => {
    const tick = () => setRemaining(remainingFrom(expiresAt, totalRef));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [expiresAt, totalRef]);
  const elapsedPct = 1 - remaining / totalRef;
  const discount = Math.round(baseDiscountPct + (maxDiscountPct - baseDiscountPct) * elapsedPct);
  const urgent = remaining < totalRef * 0.2;
  return (
    <div className={`rounded-xl border px-3 py-2 flex items-center gap-3 transition-colors ${urgent ? "border-[var(--color-grade-c)] bg-[color-mix(in_oklab,var(--color-grade-c)_8%,transparent)]" : "border-border bg-card"}`}>
      <div className="size-8 rounded-full flex items-center justify-center" style={{ background: urgent ? "var(--color-grade-c)" : "var(--color-relay)", color: "white" }}>
        <Clock className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">price drops as the clock runs out</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-base tabular" style={{ color: urgent ? "var(--color-grade-c)" : "var(--color-relay)" }}>−{discount}%</span>
          <span className="text-[11px] text-muted-foreground tabular">{fmt(remaining)}</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full" style={{ width: `${elapsedPct * 100}%`, background: urgent ? "var(--color-grade-c)" : "var(--color-relay)", transition: "width 1s linear" }} />
        </div>
      </div>
    </div>
  );
}