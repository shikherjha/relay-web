import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, ShieldCheck, Recycle, Sparkles, Users, BadgeCheck } from "lucide-react";
import { categoryImage, productImage, pctFraction, DEMO_GEO } from "@/lib/demo-constants";
import { getProducts, getRescueFeed, getSecondLife } from "@/lib/relay-api";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { useRelay } from "@/lib/store";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relay — Every product deserves a second life" },
      {
        name: "description",
        content: "AI-graded Condition Passports route returned items to their best next owner.",
      },
    ],
  }),
  component: Index,
});

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function Index() {
  const persona = useRelay((s) => s.persona);
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const { data: nearby = [] } = useQuery({
    queryKey: ["rescue-feed", "home-local"],
    queryFn: () => getRescueFeed(DEMO_GEO, { scope: "local", fallback: [] }),
  });
  const { data: secondLife = [] } = useQuery({
    queryKey: ["second-life", "home-featured"],
    queryFn: () => getSecondLife({ fallback: [] }),
  });
  const featured = products ?? [];
  const nearYou = nearby.slice(0, 4);
  const secondLifeFeatured = secondLife.slice(0, 4);

  // Seller persona's landing IS the Ops control room, not the buyer storefront.
  if (persona === "seller") return <Navigate to="/ops" replace />;

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-20 pb-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs"
          >
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Live catalog · {featured.length} SKUs seeded
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-tight mt-6"
          >
            Every product
            <br />
            deserves a{" "}
            <em className="not-italic" style={{ color: "var(--color-relay)" }}>
              second life
            </em>
            .
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed"
          >
            Relay grades every returned item into a verifiable{" "}
            <strong className="text-foreground font-medium">Condition Passport</strong>, then routes
            it to its best next owner — not the landfill.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/rescue"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-[var(--color-relay-hover)] transition-colors shadow-sm active:scale-[0.98]"
            >
              Rescue something nearby <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/genie"
              className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
            >
              Make a wish · Genie
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 18 }}
          className="card-soft p-6 relative"
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Condition Passport
          </div>
          <div className="font-display text-2xl mt-2">Grade A · verified</div>
          <div className="text-sm text-muted-foreground mt-2">
            2.4 kg CO₂ saved vs warehouse return cycle
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary">
            <ShieldCheck className="size-4" /> Anchored on LifeLedger
          </div>
        </motion.div>
      </section>

      {/* Second Life — resale marketplace teaser (below the hero) */}
      <section className="pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 relative overflow-hidden">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <Recycle className="size-3.5" style={{ color: "var(--color-relay)" }} /> Second Life
              </div>
              <h2 className="font-display text-3xl mt-2">Pre-loved, re-graded, re-priced.</h2>
              <p className="text-muted-foreground mt-2 max-w-xl text-sm">
                Member resells and Certified Second-Life refurbs — AI-graded, AI-priced, and
                ownership-transferred on the LifeLedger with escrow protection.
              </p>
            </div>
            <Link
              to="/second-life"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-[var(--color-relay-hover)] transition-colors shadow-sm active:scale-[0.98]"
            >
              Browse Second Life <ArrowRight className="size-4" />
            </Link>
          </div>

          {secondLifeFeatured.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-7">
              {secondLifeFeatured.map((l, i) => {
                const certified = l.source === "certified";
                return (
                  <motion.div
                    key={l.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to="/second-life"
                      className="group block"
                      aria-label={`View ${l.title} on Second Life`}
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                        <img
                          src={productImage(l.image_url, l.category, l.vertical)}
                          alt={l.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <GradeBadge grade={(l.resale_grade as Grade) ?? "B"} size="sm" />
                        </div>
                        <div className="absolute bottom-3 left-3 text-[10px] font-medium bg-card/85 backdrop-blur rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                          {certified ? (
                            <BadgeCheck className="size-2.5" />
                          ) : (
                            <Users className="size-2.5" />
                          )}
                          {certified ? "Certified" : "Member"}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium leading-tight line-clamp-1">
                          {l.title}
                        </div>
                        <div className="text-sm tabular mt-0.5">{inr(l.list_price)}</div>
                        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                          <Sparkles className="size-2.5" style={{ color: "var(--color-signal)" }} />{" "}
                          {inr(l.price_range.min)}–{inr(l.price_range.max)}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {nearYou.length > 0 && (
        <section className="pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1.5">
                <MapPin className="size-3" /> Near you, right now
              </div>
              <h2 className="font-display text-3xl mt-2">Just dropped nearby</h2>
            </div>
            <Link
              to="/rescue"
              className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
            >
              See everything near you <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {nearYou.map((r, i) => {
              const orig = r.original_price ?? 1999;
              const curPct = pctFraction(r.current_discount_pct);
              const price = Math.round(orig * (1 - curPct / 100));
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to="/ledger/$unitId" params={{ unitId: r.unit_id }} className="group block">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                      <img
                        src={categoryImage(r.category, r.vertical)}
                        alt={r.title ?? ""}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <GradeBadge grade={(r.grade ?? "A") as Grade} size="sm" />
                      </div>
                      <div className="absolute bottom-3 left-3 text-[10px] font-medium bg-card/85 backdrop-blur rounded-full px-2 py-0.5 inline-flex items-center gap-1">
                        <MapPin className="size-2.5" />{" "}
                        {r.distance_km != null ? `${r.distance_km} km` : "nearby"}
                      </div>
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground truncate">
                          {r.reason ?? "return"}
                        </div>
                        <div className="text-sm font-medium leading-tight mt-0.5 line-clamp-1">
                          {r.title ?? "Rescue listing"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium tabular">
                          ₹{price.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-through tabular">
                          ₹{orig.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalog</div>
            <h2 className="font-display text-3xl mt-2">Second-life ready</h2>
          </div>
          <Link
            to="/rescue"
            className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            Rescue feed <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to="/products/$id"
                params={{ id: p.id }}
                className="card-soft overflow-hidden block group"
              >
                <div className="aspect-[4/5] bg-secondary overflow-hidden relative">
                  <img
                    src={productImage(p.image_url, p.category, p.vertical)}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <GradeBadge grade="A" size="sm" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">
                    {(p.metadata as { brand?: string })?.brand ?? p.vertical}
                  </div>
                  <div className="text-sm font-medium mt-0.5">{p.title}</div>
                  <div className="text-sm tabular mt-2">₹{p.price.toLocaleString("en-IN")}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {featured.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No products loaded yet — check that relay-api is running.
          </p>
        )}
      </section>
    </div>
  );
}
