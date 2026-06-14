import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function QRBlock({ url, size = 13 }: { url: string; size?: number }) {
  // deterministic visual QR-like grid keyed by URL
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = (i: number) => {
    let x = (h ^ (i * 2654435761)) >>> 0;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
  const [copied, setCopied] = useState(false);
  const cells = Array.from({ length: size * size }, (_, i) => rand(i) > 0.55);
  // corner finder squares (3 of them)
  const finder = (r: number, c: number) => (r < 3 && c < 3) || (r < 3 && c > size - 4) || (r > size - 4 && c < 3);
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="grid p-3 rounded-xl bg-white border border-border"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 2 }}
      >
        {cells.map((on, i) => {
          const r = Math.floor(i / size), c = i % size;
          const inFinder = finder(r, c);
          const ring = (r === 0 || r === 2 || c === 0 || c === 2) && (r < 3 && c < 3);
          const ringTR = (r === 0 || r === 2 || c === size - 1 || c === size - 3) && (r < 3 && c > size - 4);
          const ringBL = (r === size - 1 || r === size - 3 || c === 0 || c === 2) && (r > size - 4 && c < 3);
          const finderDark = inFinder && (ring || ringTR || ringBL || (r === 1 && c === 1) || (r === 1 && c === size - 2) || (r === size - 2 && c === 1));
          const dark = inFinder ? finderDark : on;
          return <div key={i} style={{ width: 11, height: 11, background: dark ? "#14201B" : "transparent" }} />;
        })}
      </div>
      <button
        onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1400); }}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition"
      >
        {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />} Scan to verify
      </button>
    </div>
  );
}