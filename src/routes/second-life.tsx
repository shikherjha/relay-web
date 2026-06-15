import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  MapPin,
  BadgeCheck,
  Users,
  Check,
  Loader2,
  Recycle,
  Camera,
} from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { VerificationBadge } from "@/components/relay/VerificationBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRelay } from "@/lib/store";
import {
  buySecondLife,
  getSecondLife,
  type BuyResult,
  type ResaleListing,
  type ResaleSource,
} from "@/lib/relay-api";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/second-life")({
  head: () => ({
    meta: [
      { title: "Second Life — Relay resale marketplace" },
      {
        name: "description",
        content:
          "Member resell and Certified Second-Life pieces — AI-graded, AI-priced, ownership transferred on the LifeLedger.",
      },
    ],
  }),
  component: SecondLifePage,
});

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const VERTICALS: { id: string; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "fashion", label: "Fashion" },
  { id: "electronics", label: "Electronics" },
];

const SOURCES: { id: ResaleSource | "all"; label: string }[] = [
  { id: "all", label: "All sources" },
  { id: "p2p", label: "Member resell" },
  { id: "certified", label: "Certified Second-Life" },
];

function SourceBadge({ source }: { source: ResaleSource }) {
  const certified = source === "certified";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: certified
          ? "color-mix(in oklab, var(--color-grade-bplus) 16%, transparent)"
          : "color-mix(in oklab, var(--color-relay) 14%, transparent)",
        color: certified ? "var(--color-grade-bplus)" : "var(--color-relay)",
      }}
    >
      {certified ? <BadgeCheck className="size-2.5" /> : <Users className="size-2.5" />}
      {certified ? "Certified Second-Life" : "Member resell"}
    </span>
  );
}

const isVideo = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

/**
 * Reseller-uploaded condition media (real photos/video) for a listing. Shows a
 * thumbnail strip on the card; the dialog pairs the catalogue image with the
 * uploaded gallery so buyers see true condition shots.
 */
function ConditionGallery({ listing }: { listing: ResaleListing }) {
  const media = listing.media_urls ?? [];
  if (media.length === 0) return null;
  const caption = listing.source === "certified" ? "Seller photos" : "Member photos";
  const shown = media.slice(0, 3);
  const extra = media.length - shown.length;

  return (
    <Dialog>
      <div className="mt-3">
        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mb-1.5">
          <Camera className="size-3" /> {caption} · real condition shots
        </div>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5"
            aria-label={`View ${caption.toLowerCase()} for ${listing.title}`}
          >
            {shown.map((u, i) => (
              <span
                key={i}
                className="relative size-12 rounded-lg overflow-hidden bg-secondary border border-border"
              >
                {isVideo(u) ? (
                  <video src={u} muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                )}
                {i === shown.length - 1 && extra > 0 && (
                  <span className="absolute inset-0 bg-black/55 text-white text-xs font-medium flex items-center justify-center">
                    +{extra}
                  </span>
                )}
              </span>
            ))}
          </button>
        </DialogTrigger>
      </div>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{listing.title}</DialogTitle>
          <DialogDescription>
            Catalogue image plus the {caption.toLowerCase()} uploaded for this unit.
          </DialogDescription>
          {listing.verification && (
            <div className="pt-1">
              <VerificationBadge verification={listing.verification} />
            </div>
          )}
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Catalogue
            </div>
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-secondary">
              <img
                src={productImage(listing.image_url, listing.category, listing.vertical)}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 inline-flex items-center gap-1">
              <Camera className="size-3" /> {caption} · real condition shots
            </div>
            <div className="grid grid-cols-3 gap-2">
              {media.map((u, i) =>
                isVideo(u) ? (
                  <video
                    key={i}
                    src={u}
                    controls
                    playsInline
                    className="aspect-square w-full rounded-lg object-cover bg-secondary"
                  />
                ) : (
                  <img
                    key={i}
                    src={u}
                    alt={`condition shot ${i + 1}`}
                    loading="lazy"
                    className="aspect-square w-full rounded-lg object-cover bg-secondary"
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SecondLifePage() {
  const [vertical, setVertical] = useState<string>("all");
  const [source, setSource] = useState<ResaleSource | "all">("all");
  const [bought, setBought] = useState<Record<string, BuyResult>>({});
  const [buying, setBuying] = useState<string | null>(null);
  const addImpact = useRelay((s) => s.addImpact);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["second-life", vertical],
    queryFn: () => getSecondLife({ vertical: vertical === "all" ? undefined : vertical }),
  });

  const visible = listings.filter((l) => source === "all" || l.source === source);

  const onBuy = async (l: ResaleListing) => {
    if (buying || bought[l.id]) return;
    setBuying(l.id);
    try {
      const res = await buySecondLife(l.id);
      setBought((b) => ({ ...b, [l.id]: res }));
      addImpact(2.4, 0);
    } catch (e) {
      console.error(e);
      setBought((b) => ({
        ...b,
        [l.id]: { ok: false, listing_id: l.id, escrow_status: "failed", new_owner_id: "", tx_hash: "" },
      }));
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Recycle className="size-3.5" style={{ color: "var(--color-relay)" }} /> Second Life
          </div>
          <h1 className="font-display text-4xl mt-2">Give it a second life.</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Pre-loved pieces resold by members and refurbished units from sellers — every one
            AI-graded, AI-priced, and ownership-transferred on the LifeLedger.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-primary" /> Escrow-protected · verified history
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-sm">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`px-3 py-1.5 rounded-full transition ${source === s.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              aria-pressed={source === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-sm">
          {VERTICALS.map((v) => (
            <button
              key={v.id}
              onClick={() => setVertical(v.id)}
              className={`px-3 py-1.5 rounded-full transition ${vertical === v.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
              aria-pressed={vertical === v.id}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="mt-10 text-sm text-muted-foreground">Loading Second-Life listings…</div>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="mt-10 card-soft p-10 text-center text-sm text-muted-foreground">
          No Second-Life listings in this filter yet — resell a delivered item from{" "}
          <Link to="/amazon/orders" className="text-primary hover:underline">
            your orders
          </Link>
          .
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
        <AnimatePresence initial={false}>
          {visible.map((l, i) => {
            const result = bought[l.id];
            const isBought = Boolean(result?.ok);
            const ships = l.ships || l.fulfillment === "shipped" || l.fulfillment === "courier";
            return (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 140, damping: 22 }}
                className="card-soft overflow-hidden flex flex-col"
              >
                <Link
                  to="/ledger/$unitId"
                  params={{ unitId: l.lifeledger_unit_id ?? l.unit_id }}
                  className="relative aspect-[4/3] bg-secondary block group"
                  aria-label={`Open product page for ${l.title}`}
                >
                  <img
                    src={productImage(l.image_url, l.category, l.vertical)}
                    alt={l.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <GradeBadge grade={(l.resale_grade as Grade) ?? "B"} size="sm" />
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <SourceBadge source={l.source} />
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={
                        ships
                          ? {
                              background: "color-mix(in oklab, var(--color-grade-bplus) 14%, transparent)",
                              color: "var(--color-grade-bplus)",
                            }
                          : {
                              background: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
                              color: "var(--color-relay)",
                            }
                      }
                    >
                      {ships ? <Truck className="size-2.5" /> : <MapPin className="size-2.5" />}
                      {ships ? "Ships to you" : "Local pickup"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">· {l.age_days}d old</span>
                  </div>

                  <Link
                    to="/ledger/$unitId"
                    params={{ unitId: l.lifeledger_unit_id ?? l.unit_id }}
                    className="font-medium leading-tight mt-2 line-clamp-1 hover:text-primary transition-colors"
                  >
                    {l.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">{l.lister_label}</div>
                  {l.verification && (
                    <div className="mt-1.5">
                      <VerificationBadge verification={l.verification} />
                    </div>
                  )}

                  <div className="flex items-baseline gap-2 mt-3">
                    <div className="font-display text-xl tabular">{inr(l.list_price)}</div>
                    <div className="text-xs text-muted-foreground line-through tabular">
                      {inr(l.original_price)}
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="size-3" style={{ color: "var(--color-signal)" }} /> AI-priced
                    · range {inr(l.price_range.min)}–{inr(l.price_range.max)}
                  </div>

                  <Link
                    to="/ledger/$unitId"
                    params={{ unitId: l.lifeledger_unit_id ?? l.unit_id }}
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    View on-chain history →
                  </Link>

                  <ConditionGallery listing={l} />

                  {isBought ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 rounded-xl px-3 py-3 text-sm"
                      style={{
                        background: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
                        color: "var(--color-relay)",
                      }}
                    >
                      <div className="inline-flex items-center gap-1.5 font-medium">
                        <Check className="size-4" /> Escrow released · it's yours
                      </div>
                      {result?.tx_hash && (
                        <div className="mt-1 font-mono text-[10px] text-muted-foreground truncate">
                          tx {result.tx_hash.slice(0, 10)}…{result.tx_hash.slice(-6)}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <button
                      disabled={buying === l.id}
                      onClick={() => onBuy(l)}
                      className="mt-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] bg-primary text-primary-foreground hover:bg-[var(--color-relay-hover)] disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                    >
                      {buying === l.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Releasing escrow…
                        </>
                      ) : ships ? (
                        "Buy · ship to me"
                      ) : (
                        "Buy · keep it local"
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
