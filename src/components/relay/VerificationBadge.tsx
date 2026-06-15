import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { PassportVerification } from "@/lib/mock-data";

/**
 * Order-vs-item verification chip.
 * - green "Verified · matches your order" when color/item == "match" (and none mismatch)
 * - caution chip when either is "mismatch"
 * - renders nothing when both are "unknown"/absent
 */
export function VerificationBadge({
  verification,
  className = "",
}: {
  verification?: PassportVerification | null;
  className?: string;
}) {
  if (!verification) return null;
  const { color_match, item_match, observed_color, expected_color } = verification;
  const states = [color_match, item_match];

  if (states.every((s) => !s || s === "unknown")) return null;

  const mismatch = states.includes("mismatch");

  if (mismatch) {
    const parts: string[] = [];
    if (color_match === "mismatch") {
      parts.push(
        expected_color && observed_color
          ? `expected ${expected_color}, looks ${observed_color}`
          : "colour looks different",
      );
    }
    if (item_match === "mismatch") parts.push("item may differ from your order");
    const label = parts.join(" · ") || "doesn't match your order";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
        style={{
          color: "var(--color-signal)",
          background: "color-mix(in oklab, var(--color-signal) 14%, transparent)",
        }}
      >
        <ShieldAlert className="size-2.5" /> Heads-up · {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{
        color: "var(--color-relay)",
        background: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
      }}
    >
      <ShieldCheck className="size-2.5" /> Verified · matches your order
    </span>
  );
}
