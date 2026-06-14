import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Camera, Check, ChevronRight, RotateCcw, MapPin, Users, Wrench, Heart, Recycle, Upload, Leaf, Lock } from "lucide-react";
import { channels } from "@/lib/mock-data";
import { ConditionPassport } from "@/components/relay/ConditionPassport";
import { channelMeta, type DispositionChannel } from "@/lib/mock-extra";
import { HERO_HOODIE_UNIT_ID } from "@/lib/demo-constants";
import {
  apiPassportToUi,
  computeDisposition,
  createReturn,
  getReturnPassport,
  uploadReturnMedia,
  type DispositionDTO,
} from "@/lib/relay-api";
import type { Passport } from "@/lib/mock-data";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/returns/new")({
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
  exchange: RotateCcw, rescue: MapPin, p2p_resale: Users, refurb: Wrench, donate: Heart, recycle: Recycle, p2p: Users, restock: Wrench,
};

function ReturnsPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnId, setReturnId] = useState<string | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [disp, setDisp] = useState<DispositionDTO | null>(null);

  const reasonRow = reasons.find((r) => r.id === reason);
  const chosenChannel = (disp?.channel ?? "rescue") as DispositionChannel;
  const channelLegacyId = chosenChannel === "p2p_resale" ? "p2p" : chosenChannel;

  const startGrading = async () => {
    setError(null);
    setStep(3);
    setGrading(true);
    try {
      const apiReason = reasonRow?.api ?? "changed_mind";
      const ret = await createReturn(HERO_HOODIE_UNIT_ID, apiReason);
      setReturnId(ret.id);
      const blob = await fetch(photos[0]).then((r) => r.blob());
      await uploadReturnMedia(ret.id, blob);
      const p = await getReturnPassport(ret.id);
      setPassport(apiPassportToUi(p, "Fleece Hoodie"));
      setGrading(false);
    } catch (e) {
      setGrading(false);
      setError(e instanceof Error ? e.message : "Grading failed");
    }
  };

  const loadDisposition = async () => {
    if (!returnId) return;
    setError(null);
    try {
      const d = await computeDisposition(returnId);
      setDisp(d);
      setStep(4);
      await qc.invalidateQueries({ queryKey: ["impact"] });
      await qc.invalidateQueries({ queryKey: ["rescue-feed"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disposition failed");
    }
  };

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Start a return</div>
      <h1 className="font-display text-3xl mt-2">Let's give this item its next chapter.</h1>
      <p className="text-xs text-muted-foreground mt-2">Live flow · unit {HERO_HOODIE_UNIT_ID.slice(-4)} (seeded hoodie)</p>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="flex items-center gap-2 mt-8">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`size-7 rounded-full flex items-center justify-center text-xs font-medium tabular ${step >= n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {step > n ? <Check className="size-3.5" /> : n}
            </div>
            {n < 4 && <div className={`h-px w-10 ${step > n ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="mt-10 min-h-[420px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className="font-display text-xl">Why are you returning this?</h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {reasons.map((r) => (
                  <button key={r.id} onClick={() => setReason(r.id)}
                    className={`card-soft p-4 text-left transition-all ${reason === r.id ? "ring-2 ring-primary" : "hover:-translate-y-0.5"}`}>
                    <div className="font-medium">{r.label}</div>
                    {r.hint && <div className="text-xs text-muted-foreground mt-1">{r.hint}</div>}
                  </button>
                ))}
              </div>
              <NextBtn disabled={!reason} onClick={() => setStep(2)} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <h2 className="font-display text-xl">Show us the item.</h2>
              <label className="block mt-5 card-soft p-10 border-dashed border-2 cursor-pointer hover:bg-secondary/40 transition text-center">
                <Upload className="size-6 mx-auto text-muted-foreground" />
                <div className="text-sm font-medium mt-3">Drop a photo or click to upload</div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhotos([URL.createObjectURL(f)]);
                }} />
              </label>
              {photos.length === 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <Camera className="size-3.5 inline" /> Or{" "}
                  <button type="button" onClick={() => setPhotos(["https://images.unsplash.com/photo-1556821840-3cf63f967088?w=600"])} className="text-primary hover:underline">load demo photo</button>
                </div>
              )}
              {photos.length > 0 && (
                <img src={photos[0]} alt="" className="mt-4 max-h-48 rounded-xl object-cover" />
              )}
              <NextBtn disabled={photos.length === 0} label="Send to AI grader" onClick={startGrading} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {grading ? (
                <div className="text-center py-10">
                  <h2 className="font-display text-xl">Relay AI is grading…</h2>
                  <p className="text-sm text-muted-foreground mt-2">Calling relay-api → mock ML → LifeLedger anchor</p>
                </div>
              ) : passport ? (
                <div>
                  <h2 className="font-display text-xl">Your Condition Passport</h2>
                  <div className="mt-5 max-w-xl"><ConditionPassport p={passport} compact /></div>
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
                    <div key={c.id} className={`card-soft p-4 ${c.id === channelLegacyId ? "ring-2 ring-primary" : "opacity-70"}`}>
                      <Icon className="size-4" />
                      <div className="font-medium mt-2">{c.name}</div>
                    </div>
                  );
                })}
              </div>
              <div className="card-soft p-6 mt-6">
                <div className="font-display text-2xl">{channelMeta[chosenChannel]?.name ?? disp.channel}</div>
                <p className="text-sm text-muted-foreground mt-1">{channelMeta[chosenChannel]?.line}</p>
                <ul className="mt-4 space-y-1">
                  {disp.reasons.map((r) => (
                    <li key={r} className="text-sm flex gap-2"><Check className="size-3.5 text-primary mt-0.5" />{r}</li>
                  ))}
                </ul>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary p-3">
                    <div className="text-xs text-muted-foreground inline-flex gap-1"><Leaf className="size-3" /> Net CO₂</div>
                    <div className="font-display text-2xl tabular" style={{ color: "var(--color-relay)" }}>+{disp.net_co2_saved_kg?.toFixed(2) ?? "2.4"} kg</div>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <div className="text-xs text-muted-foreground">Engine score</div>
                    <div className="font-display text-2xl tabular text-primary">{Math.round(disp.score * 100)}%</div>
                  </div>
                </div>
                {disp.guardrails_applied.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {disp.guardrails_applied.map((g) => (
                      <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary inline-flex gap-1"><Lock className="size-3" />{g}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NextBtn({ onClick, disabled, label = "Continue" }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <div className="mt-8 flex justify-end">
      <button type="button" onClick={onClick} disabled={disabled}
        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 inline-flex items-center gap-1.5">
        {label} <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
