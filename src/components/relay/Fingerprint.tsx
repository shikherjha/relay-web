export function Fingerprint({ hash, size = 11 }: { hash: string; size?: number }) {
  // deterministic grid pattern derived from the hash
  const clean = hash.replace(/[^0-9a-f]/gi, "").padEnd(size * size, "0");
  const cells = Array.from({ length: size * size }, (_, i) => parseInt(clean[i % clean.length] ?? "0", 16));
  return (
    <div
      className="grid p-3 rounded-2xl bg-card border border-border"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 3, width: size * 18 + 24 }}
      aria-label="Passport fingerprint"
    >
      {cells.map((v, i) => {
        const palette = ["transparent", "var(--color-relay)", "var(--color-ink)", "var(--color-grade-bplus)"];
        const c = palette[v % palette.length];
        const opacity = 0.55 + (v / 30);
        return <div key={i} className="rounded-[2px]" style={{ width: 15, height: 15, background: c, opacity }} />;
      })}
    </div>
  );
}