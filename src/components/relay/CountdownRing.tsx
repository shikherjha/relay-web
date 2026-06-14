import { useEffect, useState } from "react";

export function CountdownRing({ minutes, size = 56 }: { minutes: number; size?: number }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  useEffect(() => {
    const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const total = minutes * 60;
  const pct = remaining / total;
  const urgent = pct < 0.25;
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={urgent ? "var(--color-grade-c)" : "var(--color-relay)"}
          strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${pct * c} ${c}`}
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <div className="text-[10px] font-medium tabular text-ink/80 leading-none text-center">
        <div>{m}m</div>
        <div className="opacity-60">{s.toString().padStart(2, "0")}s</div>
      </div>
    </div>
  );
}