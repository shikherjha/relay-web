import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, Camera, Sparkles, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GradeBadge } from "@/components/relay/GradeBadge";
import type { Grade } from "@/lib/mock-data";
import type { ResaleListing } from "@/lib/relay-api";

// Distinct multi-angle demo shots (front / back / detail) for rehearsals.
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1556821840-3cf63f967088?w=600",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function ResellDialog({
  trigger,
  title,
  description,
  submit,
  cta = "Get AI resale grade",
  onListed,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  submit: (files: Blob[]) => Promise<ResaleListing>;
  cta?: string;
  onListed?: (listing: ResaleListing) => void;
}) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResaleListing | null>(null);

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setBusy(false);
    setError(null);
    setResult(null);
  };

  const onPick = (picked: File[]) => {
    if (!picked.length) return;
    setFiles((f) => [...f, ...picked]);
    setPreviews((p) => [...p, ...picked.map((f) => URL.createObjectURL(f))]);
  };

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      const blobs: Blob[] = files.length
        ? files
        : await Promise.all(previews.map((u) => fetch(u).then((r) => r.blob())));
      if (!blobs.length) throw new Error("Add at least one photo or a short video.");
      const listing = await submit(blobs);
      setResult(listing);
      onListed?.(listing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
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
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {result ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-1">
            <div className="flex items-center gap-4">
              <GradeBadge grade={(result.resale_grade as Grade) ?? "B"} size="lg" />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  AI resale grade
                </div>
                <div className="font-display text-2xl leading-tight">{result.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 capitalize">
                  {result.source === "certified" ? "Certified Second-Life" : "Member resell"} ·{" "}
                  {result.category}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-secondary/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm text-muted-foreground">Suggested list price</div>
                <div className="font-display text-2xl tabular">{inr(result.list_price)}</div>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Sparkles className="size-3" style={{ color: "var(--color-signal)" }} /> AI-priced ·
                fair range {inr(result.price_range.min)}–{inr(result.price_range.max)}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                to="/second-life"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-relay-hover)] transition"
              >
                View on Second Life <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/ledger/$unitId"
                params={{ unitId: result.lifeledger_unit_id ?? result.unit_id }}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ShieldCheck className="size-4" /> LifeLedger passport
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="mt-1">
            <label className="block card-soft p-8 border-dashed border-2 cursor-pointer hover:bg-secondary/40 transition text-center">
              <Upload className="size-6 mx-auto text-muted-foreground" />
              <div className="text-sm font-medium mt-2">Drop photos/video or click to upload</div>
              <div className="text-xs text-muted-foreground mt-1">
                JPG, PNG, MP4 · multiple angles supported (1–8)
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => onPick(Array.from(e.target.files ?? []))}
              />
            </label>

            {previews.length === 0 ? (
              <div className="mt-3 text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <Camera className="size-3.5" /> Or use a sample —{" "}
                <button
                  type="button"
                  onClick={() => setPreviews(DEMO_PHOTOS)}
                  className="text-primary hover:underline"
                >
                  load demo angles
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg overflow-hidden bg-secondary relative"
                  >
                    <img src={src} alt={`angle ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-card/80 rounded px-1">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-3 text-sm text-red-600 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={busy || previews.length === 0}
              onClick={onSubmit}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-medium hover:bg-[var(--color-relay-hover)] transition disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Relay AI is grading…
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> {cta}
                </>
              )}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
