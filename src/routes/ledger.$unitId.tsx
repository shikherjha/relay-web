import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  ArrowLeft,
  Copy,
  Check,
  ShieldAlert,
  Wand2,
  MapPin,
  Users,
  RotateCcw,
  Heart,
  Recycle,
  ShoppingBag,
  RefreshCw,
  PackageCheck,
  Package,
  Camera,
} from "lucide-react";
import { useState } from "react";
import { passports } from "@/lib/mock-data";
import { ledgerVerify, type LedgerEventType } from "@/lib/mock-extra";
import { api, withFallback } from "@/lib/api";
import { productImage } from "@/lib/demo-constants";
import type { LedgerVerifyDTO } from "@/lib/relay-api";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { ConditionPassport } from "@/components/relay/ConditionPassport";
import { Fingerprint } from "@/components/relay/Fingerprint";
import { QRBlock } from "@/components/relay/QRBlock";

const isVideo = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

export const Route = createFileRoute("/ledger/$unitId")({
  head: ({ params }) => ({
    meta: [
      { title: `Provenance ${params.unitId} — Relay LifeLedger` },
      { name: "description", content: "Immutable record stored on the Relay LifeLedger." },
    ],
  }),
  component: LedgerPage,
});

const ICON: Record<LedgerEventType, typeof Wand2> = {
  GRADED: Wand2,
  RESCUED: MapPin,
  P2P_LISTED: ShoppingBag,
  P2P_SOLD: Users,
  EXCHANGED: RotateCcw,
  DONATED: Heart,
  RECYCLED: Recycle,
  REGRADE_REQUESTED: RefreshCw,
  RETURNED: Package,
  REFURBISHED: PackageCheck,
  LISTED: ShoppingBag,
};

type LedgerData = ReturnType<typeof ledgerVerify> & Partial<LedgerVerifyDTO>;

function LedgerPage() {
  const { unitId } = useParams({ from: "/ledger/$unitId" });
  const fallback = ledgerVerify(unitId) as LedgerData;
  const { data } = useQuery<LedgerData>({
    queryKey: ["ledger-verify", unitId],
    // Live verify from relay-api; graceful fallback to the deterministic mock chain.
    queryFn: () => withFallback(api<LedgerData>(`/lifeledger/${unitId}/verify`), fallback),
    placeholderData: fallback,
  });
  const verify = data ?? fallback;
  const passport = verify.passport ?? passports.find((p) => p.unitId === unitId);
  const passportHash = verify.passport_hash ?? "";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ledger/${unitId}`
      : `/ledger/${unitId}`;
  const [copied, setCopied] = useState(false);
  const copyHash = () => {
    if (!passportHash) return;
    navigator.clipboard?.writeText(passportHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <Link
        to="/"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="size-3" /> Back
      </Link>

      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Product provenance
        </div>
        <h1 className="font-display text-3xl mt-2 max-w-2xl">
          {verify.title ?? "Immutable record stored on the Relay LifeLedger"}
        </h1>
        {verify.title && (
          <div className="text-sm text-muted-foreground mt-1">
            {[verify.category, verify.vertical].filter(Boolean).join(" · ")}
          </div>
        )}
        <div className="text-sm text-muted-foreground mt-2 font-mono">{unitId}</div>
      </div>

      <ProductGallery
        catalog={productImage(verify.image_url, verify.category, verify.vertical)}
        media={verify.media_urls ?? []}
      />

      <div className="grid lg:grid-cols-[420px_1fr] gap-8 mt-10">
        {/* LEFT — fingerprint + verified + QR */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft p-6 h-fit"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Fingerprint
              </div>
              <div className="text-xs text-muted-foreground mt-1">Derived from passport hash</div>
            </div>
            {passport && (
              <GradeBadge grade={passport.grade} size="lg" confidence={passport.confidence} />
            )}
          </div>

          <div className="mt-4 flex justify-center">
            <Fingerprint hash={passportHash || unitId.replace(/-/g, "")} />
          </div>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="mt-5 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: verify.verified
                ? "color-mix(in oklab, var(--color-primary) 12%, transparent)"
                : "color-mix(in oklab, var(--color-destructive) 14%, transparent)",
            }}
          >
            {verify.verified ? (
              <ShieldCheck className="size-5 text-primary" />
            ) : (
              <ShieldAlert className="size-5 text-destructive" />
            )}
            <div>
              <div
                className="text-sm font-semibold"
                style={{
                  color: verify.verified ? "var(--color-relay)" : "var(--color-destructive)",
                }}
              >
                {verify.verified ? "Verified Authentic" : "Tampered record"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {verify.events.length} blocks · Polygon · Public
              </div>
            </div>
          </motion.div>

          {passportHash && (
            <button
              onClick={copyHash}
              className="mt-4 w-full flex items-center justify-between gap-2 text-xs font-mono bg-secondary px-3 py-2 rounded-md hover:bg-secondary/70 transition"
            >
              <span className="text-muted-foreground">passport_hash</span>
              <span className="truncate">
                {passportHash.slice(0, 10)}…{passportHash.slice(-6)}
              </span>
              {copied ? (
                <Check className="size-3 text-primary" />
              ) : (
                <Copy className="size-3 opacity-60" />
              )}
            </button>
          )}

          <div className="mt-6 pt-5 border-t border-dashed border-border flex flex-col items-center">
            <QRBlock url={shareUrl} />
          </div>
        </motion.div>

        {/* RIGHT — timeline */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-xl">Ledger history</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-secondary tabular">
              {verify.events.length} {verify.events.length === 1 ? "block" : "blocks"} verified
            </span>
          </div>

          {verify.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded for this unit yet.</p>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              {verify.events.map((e, i) => {
                const Icon = ICON[e.event_type as LedgerEventType] ?? Wand2;
                const meta = [e.created_at, e.actor, e.location].filter(Boolean).join(" · ");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, type: "spring", stiffness: 160 }}
                    className="relative pb-6 last:pb-0"
                  >
                    <div className="absolute -left-[28px] top-1 size-5 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="card-soft p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="size-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background:
                              "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                          }}
                        >
                          <Icon className="size-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="font-display text-base leading-none">
                              {e.event_type.replace(/_/g, " ")}
                            </div>
                            <span
                              className="text-[10px] uppercase tracking-wider font-medium text-primary px-2 py-0.5 rounded-full"
                              style={{
                                background:
                                  "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                              }}
                            >
                              ✓ Validated
                            </span>
                          </div>
                          {meta && <div className="text-xs text-muted-foreground mt-1">{meta}</div>}
                          {e.note && (
                            <div className="text-sm mt-2 text-foreground/80">{e.note}</div>
                          )}
                          {e.tx_hash && <CopyHash hash={e.tx_hash} />}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current condition */}
      {passport && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Current condition
              </div>
              <h2 className="font-display text-2xl mt-1">Condition Passport</h2>
            </div>
          </div>
          <div className="max-w-2xl">
            <ConditionPassport p={passport} compact />
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Product imagery: the catalogue shot plus every user-uploaded condition photo
 * (from the return grading and any resale/relist), with a click-to-swap hero.
 */
function ProductGallery({ catalog, media }: { catalog: string; media: string[] }) {
  const uploads = media.filter(Boolean);
  const all = [{ url: catalog, label: "Catalogue" }, ...uploads.map((u) => ({ url: u, label: "Uploaded" }))];
  const [active, setActive] = useState(0);
  const current = all[active] ?? all[0];

  return (
    <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-4 items-start">
      <div className="relative rounded-2xl overflow-hidden bg-secondary aspect-[16/10] max-w-2xl">
        {isVideo(current.url) ? (
          <video src={current.url} controls playsInline className="w-full h-full object-cover" />
        ) : (
          <img src={current.url} alt="" className="w-full h-full object-cover" />
        )}
        {current.label === "Uploaded" && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-medium bg-card/85 backdrop-blur rounded-full px-2 py-0.5">
            <Camera className="size-2.5" /> Real condition shot
          </span>
        )}
      </div>
      {all.length > 1 && (
        <div className="flex sm:flex-col gap-2 flex-wrap">
          {all.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View ${m.label.toLowerCase()} image ${i + 1}`}
              className={`relative size-16 rounded-lg overflow-hidden bg-secondary border-2 transition ${i === active ? "border-primary" : "border-transparent hover:border-border"}`}
            >
              {isVideo(m.url) ? (
                <video src={m.url} muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={m.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(hash);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono bg-secondary px-2 py-1 rounded hover:bg-secondary/70 transition"
    >
      <span className="text-muted-foreground">Tx:</span>
      <span>
        {hash.slice(0, 7)}…{hash.slice(-4)}
      </span>
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3 opacity-50" />}
    </button>
  );
}
