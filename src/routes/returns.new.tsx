import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Check,
  ChevronRight,
  RotateCcw,
  MapPin,
  Users,
  Wrench,
  Heart,
  Recycle,
  Upload,
  Leaf,
  Lock,
  CalendarClock,
  Truck,
  Flag,
} from "lucide-react";
import { channels } from "@/lib/mock-data";
import { ConditionPassport } from "@/components/relay/ConditionPassport";
import { channelMeta, type DispositionChannel } from "@/lib/mock-extra";
import { HERO_HOODIE_UNIT_ID, productImage } from "@/lib/demo-constants";
import {
  apiPassportToUi,
  computeDisposition,
  createReturn,
  flagWrongItemReturn,
  getOrders,
  getReturnPassport,
  uploadReturnMediaFiles,
  type DispositionDTO,
  type OrderItemDTO,
  type ReturnDTO,
} from "@/lib/relay-api";
import type { Passport } from "@/lib/mock-data";

export const Route = createFileRoute("/returns/new")({
  validateSearch: (
    s: Record<string, unknown>,
  ): { orderId?: string; orderItemId?: string; unitId?: string } => ({
    orderId: typeof s.orderId === "string" ? s.orderId : undefined,
    orderItemId: typeof s.orderItemId === "string" ? s.orderItemId : undefined,
    unitId: typeof s.unitId === "string" ? s.unitId : undefined,
  }),
  head: () => ({ meta: [{ title: "Start a return — Relay" }] }),
  component: ReturnsPage,
});

const reasons = [
  { id: "size", label: "Size / fit", api: "fit", hint: "Exchange-first routing" },
  { id: "defect", label: "Defect / damage", api: "defective" },
  { id: "wrong", label: "Wrong item received", api: "wrong_item" },
  { id: "changed", label: "Changed my mind", api: "changed_mind" },
  { id: "gift", label: "Unwanted gift", api: "changed_mind" },
];

const channelIcon: Record<string, typeof MapPin> = {
  exchange: RotateCcw,
  rescue: MapPin,
  p2p_resale: Users,
  refurb: Wrench,
  donate: Heart,
  recycle: Recycle,
  p2p: Users,
  restock: Wrench,
};

// Distinct multi-angle demo shots (front / back / defect) — fixes the Lovable bug
// where "load demo photos" pushed the same thumbnail three times.
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1556821840-3cf63f967088?w=600",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
];

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

function ReturnsPage() {
  const search = useSearch({ from: "/returns/new" });
  const qc = useQueryClient();
  const slots = useMemo(pickupSlots, []);

  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [slot, setSlot] = useState<string>("");
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ret, setRet] = useState<ReturnDTO | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [disp, setDisp] = useState<DispositionDTO | null>(null);
  // wrong_item is gated: no media, no grade — straight to a return-to-seller flag.
  const [flagging, setFlagging] = useState(false);
  const [wrongItemFlagged, setWrongItemFlagged] = useState(false);

  // Resolve the order item being returned (for context + unit fallback).
  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders([]),
    enabled: Boolean(search.orderItemId || search.orderId),
  });
  const orderItem: OrderItemDTO | undefined = useMemo(() => {
    if (!search.orderItemId) return undefined;
    for (const o of orders) {
      const found = o.items.find((it) => it.id === search.orderItemId);
      if (found) return found;
    }
    return undefined;
  }, [orders, search.orderItemId]);

  const reasonRow = reasons.find((r) => r.id === reason);
  const isWrongItem = reasonRow?.api === "wrong_item";
  const chosenChannel = (disp?.channel ?? "rescue") as DispositionChannel;
  const channelLegacyId = chosenChannel === "p2p_resale" ? "p2p" : chosenChannel;
  const slotLabel = slots.find((s) => s.value === slot)?.label ?? "";

  // Title for the passport mapper.
  const itemTitle = orderItem?.title ?? "Returned item";
  const fallbackUnit = search.unitId ?? orderItem?.unit_id ?? HERO_HOODIE_UNIT_ID;

  const startGrading = async () => {
    setError(null);
    setStep(3);
    setGrading(true);
    try {
      const apiReason = reasonRow?.api ?? "changed_mind";
      const created = await createReturn({
        orderItemId: search.orderItemId,
        unitId: search.orderItemId ? undefined : fallbackUnit,
        reasonCode: apiReason,
        pickupSlot: slot || undefined,
      });
      setRet(created);
      // Multi-angle upload: every captured photo (+ any video) goes up together.
      const blobs = await Promise.all(photos.map((src) => fetch(src).then((r) => r.blob())));
      if (blobs.length) await uploadReturnMediaFiles(created.id, blobs);
      const p = await getReturnPassport(created.id);
      // The Condition Passport should show the actual item — the buyer's first
      // uploaded angle, falling back to the product's real S3 image.
      setPassport(apiPassportToUi(p, itemTitle, photos[0] ?? orderItem?.image_url));
      setGrading(false);
    } catch (e) {
      setGrading(false);
      setError(e instanceof Error ? e.message : "Grading failed");
    }
  };

  // Gated wrong-item path: flag for the seller, skip media + grading entirely.
  const startWrongItemFlag = async () => {
    setError(null);
    setFlagging(true);
    try {
      if (search.orderItemId) await flagWrongItemReturn(search.orderItemId);
      setWrongItemFlagged(true);
      await qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not flag this return");
    } finally {
      setFlagging(false);
    }
  };

  const loadDisposition = async () => {
    if (!ret) return;
    setError(null);
    try {
      const d = await computeDisposition(ret.id);
      setDisp(d);
      setStep(4);
      await qc.invalidateQueries({ queryKey: ["impact"] });
      await qc.invalidateQueries({ queryKey: ["rescue-feed"] });
      await qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disposition failed");
    }
  };

  const pickupConfirmed = ret?.status === "picked_up" || Boolean(ret?.pickup_slot) || Boolean(slot);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <Link to="/returns" className="text-xs text-muted-foreground hover:text-foreground">
        ← Pick a different order
      </Link>
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-3">
        Start a return
      </div>
      <h1 className="font-display text-3xl mt-2">Let's give this item its next chapter.</h1>

      {orderItem ? (
        <div className="mt-5 card-soft p-4 flex items-center gap-4">
          <img
            src={productImage(orderItem.image_url, orderItem.category, orderItem.vertical)}
            alt=""
            className="size-14 rounded-lg object-cover bg-secondary"
          />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Returning
            </div>
            <div className="text-sm font-medium truncate">{orderItem.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5 tabular">
              {orderItem.category ?? "item"}
              {orderItem.size ? ` · size ${orderItem.size}` : ""} · ₹
              {orderItem.price.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-2">
          {search.orderItemId
            ? "Resolving order item…"
            : `Live flow · unit ${fallbackUnit.slice(-4)} (seeded). Or `}
          {!search.orderItemId && (
            <Link to="/returns" className="text-primary hover:underline">
              pick from your orders →
            </Link>
          )}
        </p>
      )}

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {!isWrongItem && !wrongItemFlagged && (
        <div className="flex items-center gap-2 mt-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`size-7 rounded-full flex items-center justify-center text-xs font-medium tabular ${step >= n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
              >
                {step > n ? <Check className="size-3.5" /> : n}
              </div>
              {n < 4 && <div className={`h-px w-10 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 min-h-[420px]">
        {wrongItemFlagged ? (
          <motion.div
            key="wrong-item"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl"
          >
            <div
              className="size-12 rounded-2xl flex items-center justify-center"
              style={{ background: "color-mix(in oklab, var(--color-signal) 14%, transparent)" }}
            >
              <Flag className="size-6" style={{ color: "var(--color-signal)" }} />
            </div>
            <h2 className="font-display text-2xl mt-4">We'll flag this with the seller.</h2>
            <p className="text-sm text-muted-foreground mt-2">
              A wrong item received goes straight back to the seller — no photos or AI grading
              needed. It won't be re-graded or listed for second-life resale; the seller resolves it
              and sends what you ordered.
            </p>
            <div
              className="mt-5 rounded-xl px-4 py-3 text-sm inline-flex items-center gap-2"
              style={{
                background: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
                color: "var(--color-relay)",
              }}
            >
              <Truck className="size-4" /> Return to seller · flagged for review
            </div>
            <div className="mt-6">
              <Link
                to="/amazon/orders"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--color-relay-hover)] transition"
              >
                Back to your orders <ChevronRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <h2 className="font-display text-xl">Why are you returning this?</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {reasons.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`card-soft p-4 text-left transition-all ${reason === r.id ? "ring-2 ring-primary" : "hover:-translate-y-0.5"}`}
                  >
                    <div className="font-medium">{r.label}</div>
                    {r.hint && <div className="text-xs text-muted-foreground mt-1">{r.hint}</div>}
                  </button>
                ))}
              </div>
              {isWrongItem && reason && (
                <p className="text-xs text-muted-foreground mt-4 inline-flex items-center gap-1.5">
                  <Flag className="size-3.5" style={{ color: "var(--color-signal)" }} /> Wrong item?
                  We'll flag it for the seller — no photos or grading needed.
                </p>
              )}
              <NextBtn
                disabled={!reason || flagging}
                label={isWrongItem ? (flagging ? "Flagging…" : "Flag with seller") : "Continue"}
                onClick={isWrongItem ? startWrongItemFlag : () => setStep(2)}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <h2 className="font-display text-xl">Show us the item & book a pickup.</h2>
              <p className="text-sm text-muted-foreground mt-1">
                3–5 photos from different angles (front, back, any defects). A short video is
                optional.
              </p>

              <label className="block mt-5 card-soft p-10 border-dashed border-2 cursor-pointer hover:bg-secondary/40 transition text-center">
                <Upload className="size-6 mx-auto text-muted-foreground" />
                <div className="text-sm font-medium mt-3">
                  Drop photos/video here or click to upload
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, MP4 · multiple angles supported
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setPhotos((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
                  }}
                />
              </label>
              {photos.length === 0 && (
                <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <Camera className="size-3.5" /> Or use a sample —{" "}
                  <button
                    type="button"
                    onClick={() => setPhotos(DEMO_PHOTOS)}
                    className="text-primary hover:underline"
                  >
                    load demo angles
                  </button>
                </div>
              )}
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {photos.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="aspect-square rounded-lg overflow-hidden bg-secondary relative"
                    >
                      <img
                        src={src}
                        alt={`angle ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-card/80 rounded px-1">
                        #{i + 1}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pickup scheduling — anchors the return to a real pickup slot */}
              <div className="mt-8">
                <div className="text-sm font-medium inline-flex items-center gap-1.5">
                  <CalendarClock className="size-4 text-primary" /> Choose a pickup slot
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A courier collects the item — the return is anchored to this slot.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 mt-3">
                  {slots.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSlot(s.value)}
                      className={`text-left rounded-xl border px-4 py-3 text-sm transition ${slot === s.value ? "border-primary ring-2 ring-primary/30 bg-secondary/60" : "border-border hover:border-foreground"}`}
                    >
                      <div className="font-medium">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">Doorstep pickup</div>
                    </button>
                  ))}
                </div>
              </div>

              <NextBtn
                disabled={photos.length === 0 || !slot}
                label="Send to AI grader & book pickup"
                onClick={startGrading}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {grading ? (
                <div className="text-center py-10">
                  <h2 className="font-display text-xl">Relay AI is grading…</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploading {photos.length} angle{photos.length === 1 ? "" : "s"} · calling
                    relay-api → ML grade → LifeLedger anchor
                  </p>
                </div>
              ) : passport ? (
                <div>
                  <h2 className="font-display text-xl">Your Condition Passport</h2>
                  {pickupConfirmed && (
                    <div
                      className="mt-3 inline-flex items-center gap-2 text-sm rounded-full px-3 py-1.5"
                      style={{
                        background: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
                        color: "var(--color-relay)",
                      }}
                    >
                      <Truck className="size-4" /> Pickup booked{slotLabel ? ` · ${slotLabel}` : ""}
                      {ret?.status ? (
                        <span className="text-xs opacity-70">
                          · {ret.status.replace(/_/g, " ")}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-5 max-w-xl">
                    <ConditionPassport p={passport} compact />
                  </div>
                  <NextBtn label="See routing decision" onClick={loadDisposition} />
                </div>
              ) : null}
            </motion.div>
          )}

          {step === 4 && disp && (
            <motion.div key="s4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="font-display text-xl">Best next home for this item</h2>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {channels.map((c) => {
                  const Icon = channelIcon[c.id] ?? MapPin;
                  return (
                    <div
                      key={c.id}
                      className={`card-soft p-4 ${c.id === channelLegacyId ? "ring-2 ring-primary" : "opacity-70"}`}
                    >
                      <Icon className="size-4" />
                      <div className="font-medium mt-2">{c.name}</div>
                    </div>
                  );
                })}
              </div>
              <div className="card-soft p-6 mt-6">
                <div className="font-display text-2xl">
                  {channelMeta[chosenChannel]?.name ?? disp.channel}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {channelMeta[chosenChannel]?.line}
                </p>
                <ul className="mt-4 space-y-1">
                  {disp.reasons.map((r) => (
                    <li key={r} className="text-sm flex gap-2">
                      <Check className="size-3.5 text-primary mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary p-3">
                    <div className="text-xs text-muted-foreground inline-flex gap-1">
                      <Leaf className="size-3" /> Net CO₂
                    </div>
                    <div
                      className="font-display text-2xl tabular"
                      style={{ color: "var(--color-relay)" }}
                    >
                      +{disp.net_co2_saved_kg?.toFixed(2) ?? "2.4"} kg
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <div className="text-xs text-muted-foreground">Engine score</div>
                    <div className="font-display text-2xl tabular text-primary">
                      {Math.round(disp.score * 100)}%
                    </div>
                  </div>
                </div>
                {disp.guardrails_applied.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {disp.guardrails_applied.map((g) => (
                      <span
                        key={g}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-secondary inline-flex gap-1"
                      >
                        <Lock className="size-3" />
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                {ret && (
                  <Link
                    to="/ledger/$unitId"
                    params={{ unitId: ret.unit_id ?? fallbackUnit }}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
                  >
                    View on-chain history <ChevronRight className="size-4" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function NextBtn({
  onClick,
  disabled,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-8 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 inline-flex items-center gap-1.5"
      >
        {label} <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
