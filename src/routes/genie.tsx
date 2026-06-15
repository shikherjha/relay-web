import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, ArrowRight, X, Wand2, MapPin, Truck, Globe, Wallet } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryImage } from "@/lib/demo-constants";
import { getWishMatches, postWish, type WishMatchDTO } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/genie")({
  head: () => ({
    meta: [
      { title: "Genie — Tell Relay what you want" },
      {
        name: "description",
        content:
          "Post a wish. Relay grants it the moment a returned item matches — before it goes anywhere else.",
      },
    ],
  }),
  component: GeniePage,
});

function strength(score: number) {
  const conf = Math.round(score * 100);
  if (conf >= 85) return { label: "Strong match", tone: "var(--color-relay)" };
  if (conf >= 70) return { label: "Good match", tone: "var(--color-grade-bplus)" };
  return { label: "Maybe", tone: "var(--color-signal)" };
}

function ScopeBadge({ m }: { m: WishMatchDTO }) {
  const national = m.scope === "national";
  const ships = national || m.fulfillment === "shipped" || m.fulfillment === "courier";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full"
      style={{
        background: national
          ? "color-mix(in oklab, var(--color-grade-bplus) 16%, transparent)"
          : "color-mix(in oklab, var(--color-relay) 14%, transparent)",
        color: national ? "var(--color-grade-bplus)" : "var(--color-relay)",
      }}
    >
      {national ? <Globe className="size-3" /> : <MapPin className="size-3" />}
      {national ? "National" : "Near you"}
      {ships && (
        <>
          <span className="opacity-50">·</span>
          <Truck className="size-3" /> ships
        </>
      )}
    </span>
  );
}

function GeniePage() {
  const qc = useQueryClient();
  const userId = useRelay((s) => s.userId);
  const persona = useRelay((s) => s.persona);
  const { droppedWishes, dropWish } = useRelay();

  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [budget, setBudget] = useState("");

  const { data: matches = [] } = useQuery({
    queryKey: ["wish-matches", userId],
    queryFn: () => getWishMatches([]),
  });

  const postMut = useMutation({
    mutationFn: () =>
      postWish({
        category: category.trim() || "hoodie",
        size: size || undefined,
        max_price: budget ? Number(budget) : undefined,
      }),
    onSuccess: () => {
      setCategory("");
      setSize("");
      setBudget("");
      qc.invalidateQueries({ queryKey: ["wish-matches"] });
    },
  });

  const visible = matches.filter((m) => !droppedWishes.includes(`${m.wish_id}-${m.unit_id}`));

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Wand2 className="size-3.5" style={{ color: "var(--color-signal)" }} /> Genie
      </div>
      <h1 className="font-display text-4xl mt-2">Tell Relay what you want.</h1>
      <p className="text-muted-foreground mt-2">
        We'll notify you the moment a returned item matches — local first, then nationally via
        Certified Second-Life.
      </p>

      <div className="card-soft p-5 mt-8">
        <div className="grid sm:grid-cols-[1fr_100px_140px_auto] gap-3">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. hoodie, jeans, headphones"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Size"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget ₹"
            inputMode="numeric"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 tabular"
          />
          <button
            onClick={() => postMut.mutate()}
            disabled={postMut.isPending}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-medium hover:bg-[var(--color-relay-hover)] inline-flex items-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
          >
            <Plus className="size-4" /> Make a wish
          </button>
        </div>
        <div className="text-[11px] text-muted-foreground mt-3">
          Vague is fine. Say it the way you'd say it to a friend.
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="font-display text-xl">Live matches</h2>
        {visible.length === 0 && (
          <div className="card-soft p-10 text-center text-sm text-muted-foreground">
            {persona === "seller"
              ? "No matches for the seller persona — switch to buyer (top-right) to see live Genie matches."
              : "No matches yet — make a wish above and we'll watch for a match."}
          </div>
        )}
        <AnimatePresence initial={false}>
          {visible.map((m, i) => {
            const s = strength(m.score);
            return (
              <motion.div
                key={`${m.wish_id}-${m.unit_id}`}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.4, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 200, damping: 24, delay: i * 0.04 }}
                className="card-soft p-5 relative"
              >
                <button
                  onClick={() => dropWish(`${m.wish_id}-${m.unit_id}`)}
                  title="Dismiss this match"
                  aria-label="Dismiss this match"
                  className="absolute top-3 right-3 size-7 rounded-full hover:bg-secondary inline-flex items-center justify-center text-muted-foreground"
                >
                  <X className="size-3.5" />
                </button>
                <div className="flex items-start gap-4 pr-8">
                  <img
                    src={categoryImage(m.category)}
                    alt=""
                    className="size-16 rounded-lg object-cover bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ScopeBadge m={m} />
                      {m.grade && (
                        <span className="text-[11px] text-muted-foreground">grade {m.grade}</span>
                      )}
                      {m.price_fit && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
                            color: "var(--color-relay)",
                          }}
                        >
                          <Wallet className="size-2.5" /> Within your budget
                        </span>
                      )}
                    </div>
                    <div className="font-medium mt-1.5 truncate">
                      {m.title ?? "Returned unit nearby"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 tabular">
                      {(() => {
                        const price = m.list_price ?? m.price;
                        return price != null ? `₹${price.toLocaleString("en-IN")} · ` : "";
                      })()}
                      {m.distance_km != null ? `${m.distance_km.toFixed(1)} km away` : "nearby"}
                    </div>
                    {m.price_range && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                        <Sparkles className="size-2.5" style={{ color: "var(--color-signal)" }} />{" "}
                        AI-priced · ₹{m.price_range.min.toLocaleString("en-IN")}–₹
                        {m.price_range.max.toLocaleString("en-IN")}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <Link
                        to="/ledger/$unitId"
                        params={{ unitId: m.unit_id }}
                        className="text-[11px] text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Verify passport <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                  <motion.span
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 shrink-0"
                    style={{
                      background: `color-mix(in oklab, ${s.tone} 18%, transparent)`,
                      color: s.tone,
                    }}
                  >
                    <Sparkles className="size-3" /> {Math.round(m.score * 100)}%
                  </motion.span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Prefer to browse?{" "}
        <Link to="/rescue" className="text-primary hover:underline">
          Open the rescue feed →
        </Link>
      </div>
    </div>
  );
}
