import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function DecayClock({
  ttlSeconds,
  baseDiscountPct,
  maxDiscountPct,
}: {
  ttlSeconds: number;
  baseDiscountPct: number;
  maxDiscountPct: number;
}) {
  const totalRef = useState(() => Math.max(ttlSeconds, 60))[0];
  const [remaining, setRemaining] = useState(ttlSeconds);
  useEffect(() => {
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const elapsedPct = 1 - remaining / totalRef;
  const discount = Math.round(baseDiscountPct + (maxDiscountPct - baseDiscountPct) * elapsedPct);
  const urgent = remaining < totalRef * 0.2;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return (
    <div className={`rounded-xl border px-3 py-2 flex items-center gap-3 transition-colors ${urgent ? "border-[var(--color-grade-c)] bg-[color-mix(in_oklab,var(--color-grade-c)_8%,transparent)]" : "border-border bg-card"}`}>
      <div className="size-8 rounded-full flex items-center justify-center" style={{ background: urgent ? "var(--color-grade-c)" : "var(--color-relay)", color: "white" }}>
        <Clock className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">price drops as the clock runs out</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-base tabular" style={{ color: urgent ? "var(--color-grade-c)" : "var(--color-relay)" }}>−{discount}%</span>
          <span className="text-[11px] text-muted-foreground tabular">{mins}m {secs.toString().padStart(2, "0")}s left</span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full" style={{ width: `${elapsedPct * 100}%`, background: urgent ? "var(--color-grade-c)" : "var(--color-relay)", transition: "width 1s linear" }} />
        </div>
      </div>
    </div>
  );
}