import type { ReactNode } from "react";
import { Info, Loader2, PlugZap, RefreshCw, ShieldCheck } from "lucide-react";
import type { ProductConfidenceDTO } from "@/lib/relay-api";

/**
 * Per-product cart nudge (§21.1 cart v2) — scannable, scored for THIS line's
 * recipient. Shows only what's useful (nothing for a clean keeper), and every
 * risk comes with a one-tap fix so it reads as help, not friction:
 *  - too many sizes for the SAME person → "Keep size M"
 *  - wrong size for the recipient        → "Switch to S"
 *  - electronics                         → "works with what you own" verdict
 *                                          + "what people returned this for"
 *  - confident pick                      → a quiet "Looks like a keeper"
 */

type Tone = "warn" | "good" | "muted";

const TONE_COLOR: Record<Tone, string | undefined> = {
  warn: "var(--color-signal)",
  good: "var(--color-relay)",
  muted: undefined,
};

function Row({
  tone,
  icon: Icon,
  children,
}: {
  tone: Tone;
  icon: typeof Info;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] ${tone === "muted" ? "text-muted-foreground" : ""}`}
      style={tone === "good" ? { color: "var(--color-relay)" } : undefined}
    >
      <Icon className="size-3.5 shrink-0" style={{ color: TONE_COLOR[tone] }} />
      <span className={tone === "warn" ? "text-foreground" : ""}>{children}</span>
    </div>
  );
}

function Action({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="ml-1 inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium hover:bg-secondary transition disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : children}
    </button>
  );
}

export function CartLineNudge({
  item,
  onKeepSize,
  onSwapSize,
  busy = false,
}: {
  item: ProductConfidenceDTO;
  onKeepSize?: (keepSize: string, lineIds: string[]) => void;
  onSwapSize?: (size: string) => void;
  busy?: boolean;
}) {
  const who = item.for_self ? "you" : item.profile_name;

  const drop = item.interventions.find((iv) => iv.action === "remove_extra_sizes");
  const dupDriver = item.drivers.find((d) => ["bracketing", "duplicate_variant"].includes(d.type));
  const mismatch = item.interventions.find(
    (iv) => iv.type === "size_recommendation" && iv.suggested_size && iv.action !== "remove_extra_sizes",
  );
  const verdict = item.drivers.find((d) => d.type === "compatibility_match");
  const insight = item.interventions.find((iv) => iv.type === "return_insight");
  const risk = item.drivers.find(
    (d) => !d.positive && ["sku_return_health", "fit_signal"].includes(d.type),
  );
  const good = item.drivers.find((d) => d.positive && d.type === "fit_confidence");

  const rows: ReactNode[] = [];

  if (drop && dupDriver) {
    rows.push(
      <Row key="dup" tone="warn" icon={Info}>
        <span className="inline-flex items-center gap-1 flex-wrap">
          {dupDriver.label}
          {drop.suggested_size && (
            <Action busy={busy} onClick={() => onKeepSize?.(drop.suggested_size!, item.line_ids)}>
              Keep size {drop.suggested_size}
            </Action>
          )}
        </span>
      </Row>,
    );
  } else if (mismatch?.suggested_size) {
    rows.push(
      <Row key="mis" tone="warn" icon={Info}>
        <span className="inline-flex items-center gap-1 flex-wrap">
          {mismatch.label}
          <Action busy={busy} onClick={() => onSwapSize?.(mismatch.suggested_size!)}>
            <RefreshCw className="size-3" /> Switch to {mismatch.suggested_size}
          </Action>
        </span>
      </Row>,
    );
  }

  if (verdict) {
    rows.push(
      <Row key="verdict" tone="good" icon={PlugZap}>
        {verdict.label}
      </Row>,
    );
  }

  if (insight && item.return_reason) {
    const pct = Math.round((item.return_reason_share ?? 0) * 100);
    rows.push(
      <Row key="insight" tone="muted" icon={Info}>
        Most returns here: &lsquo;{item.return_reason.replace(/_/g, " ")}&rsquo;
        {pct ? ` · ${pct}%` : ""} — {insight.label}
      </Row>,
    );
  }

  if (!drop && !mismatch && !insight && risk) {
    rows.push(
      <Row key="risk" tone="muted" icon={Info}>
        {risk.label}
      </Row>,
    );
  }

  if (rows.length === 0 && good) {
    rows.push(
      <Row key="good" tone="good" icon={ShieldCheck}>
        Looks like a keeper for {who}
      </Row>,
    );
  }

  if (rows.length === 0) return null;
  return <div className="mt-1.5 space-y-1">{rows}</div>;
}
