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
  ExternalLink,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { passports } from "@/lib/mock-data";
import { ledgerVerify, type LedgerEventType } from "@/lib/mock-extra";
import { api, withFallback } from "@/lib/api";
import { productImage, pctFraction } from "@/lib/demo-constants";
import {
  getRescueFeed,
  getSecondLife,
  type LedgerVerifyDTO,
  type RescueListingDTO,
  type ResaleListing,
} from "@/lib/relay-api";
import { useRelay } from "@/lib/store";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { ConditionPassport } from "@/components/relay/ConditionPassport";
import { DecayClock } from "@/components/relay/DecayClock";
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

  // Is this unit currently buyable? Cross-reference the live Second-Life + Rescue
  // feeds so the provenance page doubles as a product page (price · cart · timer).
  const relayCart = useRelay((s) => s.relayCart);
  const addToRelayCart = useRelay((s) => s.addToRelayCart);
  const { data: secondLife = [] } = useQuery({
    queryKey: ["second-life", "ledger"],
    queryFn: () => getSecondLife({ fallback: [] }),
  });
  const { data: rescueFeed = [] } = useQuery({
    queryKey: ["rescue-feed", "all", "ledger"],
    queryFn: () => getRescueFeed(undefined, { scope: "all", fallback: [] }),
  });
  const listing = resolveListing(unitId, secondLife, rescueFeed);
  const rescueClock =
    listing && listing.kind === "rescue" && !listing.ships && listing.ttl > 0 && listing.expiresAt
      ? listing
      : null;
  const inCart = Boolean(listing && relayCart.some((c) => c.listingId === listing.listingId));
  const metaDescription = buildDescription(verify, passport?.grade ?? listing?.grade, listing?.ships);
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

      {/* About + buy panel — provenance page doubles as the product page. */}
      <div className="mt-6 card-soft p-5 grid md:grid-cols-[1fr_auto] gap-5 md:items-center">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            About this item
          </div>
          <p className="text-sm text-foreground/80 mt-1.5 max-w-xl">{metaDescription}</p>
          {rescueClock && (
            <div className="mt-3 max-w-sm">
              <DecayClock
                ttlSeconds={rescueClock.ttl}
                expiresAt={rescueClock.expiresAt}
                baseDiscountPct={rescueClock.basePct}
                maxDiscountPct={rescueClock.maxPct}
              />
            </div>
          )}
          {listing?.kind === "rescue" && listing.ships && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground rounded-lg border border-border px-2.5 py-1.5">
              <Truck className="size-3" /> Ships to you · fixed price (no time decay)
            </div>
          )}
        </div>

        {listing && listing.price != null && (
          <div className="md:text-right shrink-0">
            <div className="flex md:justify-end items-baseline gap-2">
              <div className="font-display text-2xl tabular">
                ₹{listing.price.toLocaleString("en-IN")}
              </div>
              {listing.original != null && listing.original > listing.price && (
                <div className="text-xs text-muted-foreground line-through tabular">
                  ₹{listing.original.toLocaleString("en-IN")}
                </div>
              )}
            </div>
            {listing.priceRange && (
              <div className="text-[11px] text-muted-foreground mt-0.5">
                AI-priced · ₹{listing.priceRange.min.toLocaleString("en-IN")}–₹
                {listing.priceRange.max.toLocaleString("en-IN")}
              </div>
            )}
            {inCart ? (
              <Link
                to="/relay-cart"
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium"
                style={{
                  background: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
                  color: "var(--color-relay)",
                }}
              >
                <Check className="size-4" /> In cart · review
              </Link>
            ) : (
              <button
                onClick={() =>
                  addToRelayCart({
                    kind: listing.kind,
                    listingId: listing.listingId,
                    unitId,
                    title: listing.title ?? verify.title ?? "Listing",
                    imageUrl: listing.imageUrl ?? verify.image_url ?? null,
                    category: listing.category ?? verify.category,
                    vertical: listing.vertical ?? verify.vertical,
                    price: listing.price!,
                    grade: listing.grade,
                    ships: listing.ships,
                    source: listing.source,
                  })
                }
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-[var(--color-relay-hover)] transition active:scale-[0.98]"
              >
                <ShoppingBag className="size-4" /> Add to cart{listing.ships ? " · ship to me" : " · pickup"}
              </button>
            )}
          </div>
        )}
      </div>

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
                {verify.events.length} blocks ·{" "}
                {verify.on_chain ? `${verify.network ?? "Chain"} · on-chain` : "Polygon · demo anchor"}
              </div>
            </div>
          </motion.div>

          {verify.on_chain && verify.explorer_url && (
            <a
              href={verify.explorer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2 transition hover:opacity-90"
              style={{
                background: "color-mix(in oklab, var(--color-primary) 10%, transparent)",
                color: "var(--color-relay)",
              }}
            >
              <ShieldCheck className="size-3.5" /> Anchored on {verify.network ?? "chain"} · view tx
              <ExternalLink className="size-3" />
            </a>
          )}

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
                          <div className="flex items-center gap-3 flex-wrap">
                            {e.tx_hash && <CopyHash hash={e.tx_hash} />}
                            {e.explorer_url && (
                              <a
                                href={e.explorer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(ev) => ev.stopPropagation()}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                              >
                                PolygonScan <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
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

type BuyListing = {
  kind: "second_life" | "rescue";
  listingId: string;
  price: number | null;
  original: number | null;
  ships: boolean;
  grade?: string | null;
  title?: string | null;
  category?: string | null;
  vertical?: string | null;
  imageUrl?: string | null;
  source?: string | null;
  priceRange?: { min: number; max: number } | null;
  ttl: number;
  expiresAt?: string | null;
  basePct: number;
  maxPct: number;
};

/** Find an active Second-Life (preferred) or Rescue listing for this unit. */
function resolveListing(
  unitId: string,
  secondLife: ResaleListing[],
  rescueFeed: RescueListingDTO[],
): BuyListing | null {
  const sl = secondLife.find((l) => l.unit_id === unitId);
  if (sl) {
    return {
      kind: "second_life",
      listingId: sl.id,
      price: sl.list_price,
      original: sl.original_price,
      ships: Boolean(sl.ships),
      grade: sl.resale_grade,
      title: sl.title,
      category: sl.category,
      vertical: sl.vertical,
      imageUrl: sl.image_url,
      source: sl.source,
      priceRange: sl.price_range,
      ttl: 0,
      expiresAt: null,
      basePct: 0,
      maxPct: 0,
    };
  }
  const r = rescueFeed.find((x) => x.unit_id === unitId && x.status === "active");
  if (r) {
    const orig = r.original_price ?? null;
    const curPct = pctFraction(r.current_discount_pct);
    const price = r.list_price ?? (orig != null ? Math.round(orig * (1 - curPct / 100)) : null);
    return {
      kind: "rescue",
      listingId: r.id,
      price,
      original: orig,
      ships: r.scope === "national" || Boolean(r.ships),
      grade: r.grade,
      title: r.title,
      category: r.category,
      vertical: r.vertical,
      imageUrl: null,
      source: null,
      priceRange: r.price_range ?? null,
      ttl: r.ttl_seconds ?? 0,
      expiresAt: r.expires_at,
      basePct: pctFraction(r.base_discount_pct),
      maxPct: pctFraction(r.max_discount_pct ?? 0.45),
    };
  }
  return null;
}

/** A short, human meta-description for the product page (no extra API call). */
function buildDescription(
  verify: { category?: string | null; vertical?: string | null; events?: unknown[] },
  grade?: string | null,
  ships?: boolean,
): string {
  const catPhrase = [verify.category, verify.vertical].filter(Boolean).join(" · ") || "item";
  const events = verify.events?.length ?? 0;
  const gradePhrase = grade ? `Grade ${grade} · ` : "";
  const fulfil = ships ? "Ships to you." : "Available for local pickup near you.";
  return `${gradePhrase}${catPhrase}. Inspected and graded by Relay AI, with ${events} verified event${events === 1 ? "" : "s"} on the LifeLedger condition passport. ${fulfil}`;
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
