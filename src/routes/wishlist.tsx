import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryImage, DEMO_GEO } from "@/lib/demo-constants";
import { getWishMatches, postWish } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Reverse Wishlist — Relay" }, { name: "description", content: "Post what you want. Relay matches it when a returned item fits." }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const qc = useQueryClient();
  const userId = useRelay((s) => s.userId);
  const persona = useRelay((s) => s.persona);
  const [category, setCategory] = useState("hoodie");
  const [size, setSize] = useState("M");
  const [budget, setBudget] = useState("2200");

  const { data: matches = [] } = useQuery({
    queryKey: ["wish-matches", userId],
    queryFn: () => getWishMatches([]),
  });

  const postMut = useMutation({
    mutationFn: () =>
      postWish({
        category,
        size: size || undefined,
        max_price: budget ? Number(budget) : undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wish-matches"] }),
  });

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reverse Wishlist</div>
      <h1 className="font-display text-4xl mt-2">Tell Relay what you want.</h1>
      <p className="text-muted-foreground mt-2">pgvector cosine match against returned units near you ({DEMO_GEO.lat}, {DEMO_GEO.lng}).</p>

      <div className="card-soft p-5 mt-8">
        <div className="grid sm:grid-cols-[1fr_100px_140px_auto] gap-3">
          <input
            value={category} onChange={(e) => setCategory(e.target.value)}
            placeholder="Category e.g. hoodie"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={size} onChange={(e) => setSize(e.target.value)}
            placeholder="Size"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={budget} onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget ₹"
            inputMode="numeric"
            className="bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 tabular"
          />
          <button
            onClick={() => postMut.mutate()}
            disabled={postMut.isPending}
            className="bg-primary text-primary-foreground rounded-xl px-5 py-3 text-sm font-medium hover:bg-[var(--color-relay-hover)] inline-flex items-center gap-2 active:scale-[0.98] transition"
          >
            <Plus className="size-4" /> Post
          </button>
        </div>
      </div>

      <div className="mt-10 space-y-4">
        <h2 className="font-display text-xl">Live matches</h2>
        {matches.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {persona === "seller"
              ? "No matches for the seller persona — switch to buyer (top-right) to see live wishlist matches."
              : "No matches yet — post a wish above, or hit ↻ to reset demo data."}
          </p>
        )}
        <AnimatePresence initial={false}>
          {matches.map((m, i) => (
            <motion.div
              key={`${m.wish_id}-${m.unit_id}`}
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-soft p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={categoryImage("hoodie")} alt="" className="size-14 rounded-lg object-cover" />
                  <div>
                    <div className="text-xs text-muted-foreground">Unit</div>
                    <div className="font-mono text-sm">{m.unit_id.slice(0, 18)}…</div>
                    <div className="text-xs text-muted-foreground mt-1 tabular">
                      {m.distance_km != null ? `${m.distance_km.toFixed(1)} km away` : "nearby"}
                    </div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                  style={{ background: "color-mix(in oklab, var(--color-signal) 18%, transparent)", color: "var(--color-signal)" }}>
                  <Sparkles className="size-3" /> {Math.round(m.score * 100)}% match
                </span>
              </div>
              <Link to="/ledger/$unitId" params={{ unitId: m.unit_id }}
                className="mt-4 text-[11px] text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
                Verify passport <ArrowRight className="size-3" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
