import { Check, ChevronDown, Gift, Loader2 } from "lucide-react";
import type { FitProfileEntryDTO } from "@/lib/relay-api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Per-line recipient chip (§21.1 cart v2) — "for You ▾".
 *
 * Each cart line is *for* someone: yourself, a saved person, or "Anyone" (an
 * unassigned gift). Assigning per line is what stops two sizes of one item bought
 * for two different people from being flagged as a bracketing return.
 */
function label(profiles: FitProfileEntryDTO[], value: string | null | undefined): string {
  if (!value || value === "anyone") return "Anyone";
  const p = profiles.find((x) => x.id === value);
  return p ? (p.is_self ? "You" : p.name) : "Anyone";
}

export function CartRecipientChip({
  value,
  profiles,
  onChange,
  busy = false,
}: {
  value: string | null | undefined;
  profiles: FitProfileEntryDTO[];
  onChange: (profileId: string | null) => void;
  busy?: boolean;
}) {
  const isAnyone = !value || value === "anyone";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:border-foreground transition"
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <span>for</span>}
          <span className="font-medium text-foreground">{label(profiles, value)}</span>
          <ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          Who's this for?
        </div>
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary transition"
          >
            <span>{p.is_self ? "You" : p.name}</span>
            {value === p.id && <Check className="size-3.5 text-primary" />}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(null)}
          className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary transition border-t border-border mt-1 pt-2"
        >
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Gift className="size-3.5" /> Anyone (a gift)
          </span>
          {isAnyone && <Check className="size-3.5 text-primary" />}
        </button>
      </PopoverContent>
    </Popover>
  );
}
