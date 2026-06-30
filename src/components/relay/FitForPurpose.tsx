import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight, Info, Loader2, PlugZap, ShieldCheck } from "lucide-react";
import { setDeviceSetup } from "@/lib/relay-api";
import type { ReturnConfidenceDTO } from "@/lib/relay-api";

/**
 * Electronics "fit-for-purpose" guidance (§21.1 Phase 3).
 *
 * Where a fashion PDP asks "what size?", electronics asks "will this work for
 * ME?" — and we beat the static description/FAQ two ways Amazon's PDP can't:
 *  1. a personalized verdict from what the buyer already OWNS / their setup
 *     ("Pairs with your iPhone ✓"), and
 *  2. the SKU's REAL dominant return reason + share ("38% returned for 'not as
 *     described' — here's what to check").
 * Plus a 1-tap setup capture so the verdict gets sharper over time.
 */
export function FitForPurpose({
  confidence,
  className = "",
}: {
  confidence: ReturnConfidenceDTO;
  className?: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const item = confidence.items[0];
  const verdict = item?.drivers.find((d) => d.type === "compatibility_match")?.label;
  const compat = confidence.interventions.find((iv) => iv.type === "compatibility_check");
  const checklist = compat?.items ?? [];
  const insightIv = confidence.interventions.find((iv) => iv.type === "return_insight");
  const offersSetup = confidence.interventions.some((iv) => iv.type === "setup_capture");
  const returnReason = item?.return_reason;
  const returnRate = Math.round((item?.return_rate ?? 0) * 100);

  const saveSetup = useMutation({
    mutationFn: (setup: Record<string, string>) => setDeviceSetup(setup),
    onSuccess: async () => {
      setEditing(false);
      await qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey?.[0] === "product-confidence" || q.queryKey?.[0] === "fit-profiles",
      });
    },
  });

  if (checklist.length === 0 && !verdict && !returnReason) return null;

  return (
    <div className={`rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <PlugZap className="size-4" style={{ color: "var(--color-relay)" }} />
        Will this work for you?
      </div>

      {/* 1) Personalized verdict — "works with what you own". */}
      {verdict && (
        <div
          className="mt-2.5 flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-relay)" }}
        >
          <ShieldCheck className="size-4 shrink-0" />
          {verdict}
        </div>
      )}

      {/* Setup capture — when we couldn't personalize it ourselves yet. */}
      {(offersSetup || editing) && (
        <SetupCapture
          busy={saveSetup.isPending}
          editing={editing}
          onEdit={() => setEditing(true)}
          onSave={(s) => saveSetup.mutate(s)}
          onCancel={() => setEditing(false)}
        />
      )}
      {verdict && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 text-[11px] text-primary hover:underline"
        >
          Change my setup
        </button>
      )}

      {/* 2) Returns, upfront — the SKU's real RETURN RATE (how often it's sent
          back), with the top reason as soft context. We show the rate, not a
          defect-share, so it reads as honest transparency rather than alarm. */}
      {returnReason && (
        <div className="mt-3 rounded-md bg-secondary/60 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Info className="size-3.5 shrink-0" style={{ color: "var(--color-relay)" }} />
            Good to know
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            {returnRate
              ? `About ${returnRate}% of buyers return this`
              : "Returns here are uncommon"}
            {returnReason ? `, most often for ‘${returnReason.replace(/_/g, " ")}’.` : "."}
            {insightIv ? ` ${insightIv.label}` : ""}
          </div>
        </div>
      )}

      {/* Baseline checklist — the "good to check before you buy" list. */}
      {checklist.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {checklist.map((t) => (
            <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="size-3.5 mt-0.5 shrink-0" style={{ color: "var(--color-relay)" }} />
              {t}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" style={{ color: "var(--color-relay)" }} />
        Condition-graded · free 14-day returns if it's not right
      </div>
    </div>
  );
}

const PHONES = [
  { value: "ios", label: "iPhone" },
  { value: "android", label: "Android" },
];
const LAPTOPS = [
  { value: "usb-c", label: "USB-C" },
  { value: "usb-a", label: "USB-A" },
];

function SetupCapture({
  editing,
  busy,
  onEdit,
  onSave,
  onCancel,
}: {
  editing: boolean;
  busy: boolean;
  onEdit: () => void;
  onSave: (setup: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [laptop, setLaptop] = useState("");

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
      >
        Tell us your setup for an instant compatibility check
        <ChevronRight className="size-3" />
      </button>
    );
  }

  const Chips = ({
    value,
    set,
    options,
  }: {
    value: string;
    set: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => set(value === o.value ? "" : o.value)}
          className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
            value === o.value
              ? "border-foreground bg-secondary font-medium"
              : "border-border hover:bg-secondary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mt-2.5 rounded-md border border-border p-2.5 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Your phone</span>
        <Chips value={phone} set={setPhone} options={PHONES} />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Laptop port</span>
        <Chips value={laptop} set={setLaptop} options={LAPTOPS} />
      </div>
      <div className="flex gap-2 pt-0.5">
        <button
          type="button"
          disabled={busy || (!phone && !laptop)}
          onClick={() => {
            const setup: Record<string, string> = {};
            if (phone) setup.phone = phone;
            if (laptop) setup.laptop = laptop;
            onSave(setup);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1 text-[11px] font-medium disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1 text-[11px] hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
