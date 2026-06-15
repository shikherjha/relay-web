import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Repeat, Truck, Leaf, ArrowRight, Loader2, CalendarClock, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { exchangeOrderItem, type ExchangeResult, type OrderItemDTO } from "@/lib/relay-api";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const SIZES = ["XS", "S", "M", "L", "XL"];

function pickupSlots() {
  const now = new Date();
  const mk = (addDays: number, h: number, label: string) => {
    const d = new Date(now);
    d.setDate(d.getDate() + addDays);
    d.setHours(h, 0, 0, 0);
    return { value: d.toISOString(), label };
  };
  return [
    mk(0, 18, "Today · 6–9 PM"),
    mk(1, 9, "Tomorrow · 9 AM–12 PM"),
    mk(1, 14, "Tomorrow · 2–5 PM"),
    mk(2, 11, "In 2 days · 11 AM–2 PM"),
  ];
}

export function ExchangeDialog({
  trigger,
  item,
}: {
  trigger: React.ReactNode;
  item: OrderItemDTO;
}) {
  const qc = useQueryClient();
  const slots = useMemo(pickupSlots, []);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [variant, setVariant] = useState("");
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExchangeResult | null>(null);

  const reset = () => {
    setSize("");
    setVariant("");
    setSlot("");
    setBusy(false);
    setError(null);
    setResult(null);
  };

  const canConfirm = Boolean(size || variant.trim());

  const onConfirm = async () => {
    if (!canConfirm) return;
    setError(null);
    setBusy(true);
    try {
      const res = await exchangeOrderItem(item.id, {
        new_size: size || undefined,
        new_variant: variant.trim() || undefined,
        pickup_slot: slot || undefined,
      });
      setResult(res);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["rescue-feed"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exchange failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {result ? "Exchange confirmed" : "Exchange this item"}
          </DialogTitle>
          {!result && (
            <DialogDescription>
              Pick a new size and/or variant. No photos or grading needed — your replacement ships
              and the pristine item is kept in the loop.
            </DialogDescription>
          )}
        </DialogHeader>

        {result ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-1">
            <div className="flex items-start gap-3">
              <div
                className="size-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in oklab, var(--color-relay) 14%, transparent)" }}
              >
                <Check className="size-5" style={{ color: "var(--color-relay)" }} />
              </div>
              <div className="min-w-0">
                <div className="font-medium leading-tight">Your replacement is on the way</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {result.replacement.title}
                  {result.replacement.size ? ` · size ${result.replacement.size}` : ""}
                  {result.replacement.variant ? ` · ${result.replacement.variant}` : ""}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--color-secondary)" }}>
              <div className="inline-flex items-center gap-1.5 font-medium">
                <Leaf className="size-4" style={{ color: "var(--color-relay)" }} /> Cutting emissions
              </div>
              <p className="text-muted-foreground mt-1">
                Your returned item is pristine, so we'll offer it to a nearby buyer to cut emissions
                instead of warehousing it.
                {result.rescue_listing?.list_price != null
                  ? ` Listed at ${inr(result.rescue_listing.list_price)} until pickup.`
                  : ""}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/rescue"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-relay-hover)] transition"
              >
                See the rescue feed <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/amazon/orders"
                onClick={() => setOpen(false)}
                className="text-sm text-primary hover:underline"
              >
                Back to your orders
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="mt-1 space-y-5">
            <div className="card-soft p-3 flex items-center gap-3">
              <div className="text-sm">
                <div className="font-medium leading-tight line-clamp-1">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.category ?? "item"}
                  {item.size ? ` · current size ${item.size}` : ""}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium">New size</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize((cur) => (cur === s ? "" : s))}
                    className={`size-10 rounded-lg border text-sm transition ${size === s ? "border-foreground bg-secondary" : "border-border hover:border-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
                <input
                  value={SIZES.includes(size) ? "" : size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Other"
                  className="w-24 rounded-lg border border-border bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  aria-label="Other size"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium" htmlFor="exchange-variant">
                New variant <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="exchange-variant"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. colour / style"
                className="mt-2 w-full rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <div className="text-sm font-medium inline-flex items-center gap-1.5">
                <CalendarClock className="size-4 text-primary" /> Pickup slot{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 mt-2">
                {slots.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSlot((cur) => (cur === s.value ? "" : s.value))}
                    className={`text-left rounded-xl border px-3 py-2.5 text-sm transition ${slot === s.value ? "border-primary ring-2 ring-primary/30 bg-secondary/60" : "border-border hover:border-foreground"}`}
                  >
                    <div className="font-medium">{s.label}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Truck className="size-3" /> Doorstep pickup
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={busy || !canConfirm}
              onClick={onConfirm}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-medium hover:bg-[var(--color-relay-hover)] transition disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Confirming exchange…
                </>
              ) : (
                <>
                  <Repeat className="size-4" /> Confirm exchange
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
