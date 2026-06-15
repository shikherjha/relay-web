import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, ArrowRight, X, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteWish, getWishes, getWishMatches, postWish } from "@/lib/relay-api";
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

function GeniePage() {
  const qc = useQueryClient();
  const userId = useRelay((s) => s.userId);
  const { myWishes, addMyWish, removeMyWish } = useRelay();

  const [category, setCategory] = useState("");
  const [size, setSize] = useState("");
  const [budget, setBudget] = useState("");

  const { data: matches = [] } = useQuery({
    queryKey: ["wish-matches", userId],
    queryFn: () => getWishMatches([]),
  });

  // Backend is the source of truth for "Your wishes" → survives a page reload.
  // Locally-added wishes (optimistic, not yet in the refetched list) are merged on top.
  const { data: backendWishes = [] } = useQuery({
    queryKey: ["wishes", userId],
    queryFn: () => getWishes([]),
  });
  const displayWishes = useMemo(() => {
    const fromApi = backendWishes.map((w) => ({
      id: w.id,
      category: w.category,
      size: w.size ?? null,
      budget: w.max_price ?? null,
      createdAt: 0,
    }));
    const extra = myWishes.filter((mw) => !fromApi.some((b) => b.id === mw.id));
    return [...extra, ...fromApi];
  }, [backendWishes, myWishes]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishes"] });
      qc.invalidateQueries({ queryKey: ["wish-matches"] });
    },
  });

  const postMut = useMutation({
    mutationFn: () =>
      postWish({
        category: category.trim() || "hoodie",
        size: size || undefined,
        max_price: budget ? Number(budget) : undefined,
      }),
    onSuccess: (wish) => {
      // Surface the wish immediately so "wish added" is visible — matches stream
      // in async via /wishlist/matches and attach by wish_id.
      addMyWish({
        id: wish.id,
        category: category.trim() || "hoodie",
        size: size || null,
        budget: budget ? Number(budget) : null,
        createdAt: Date.now(),
      });
      setCategory("");
      setSize("");
      setBudget("");
      qc.invalidateQueries({ queryKey: ["wishes"] });
      qc.invalidateQueries({ queryKey: ["wish-matches"] });
    },
  });

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

      {displayWishes.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="font-display text-xl">Your wishes</h2>
          <AnimatePresence initial={false}>
            {displayWishes.map((w) => {
              const wm = matches.filter((m) => m.wish_id === w.id);
              const top = wm[0];
              const found = wm.length > 0;
              return (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="card-soft p-4 flex items-center gap-4 relative"
                  style={
                    found
                      ? { borderColor: "color-mix(in oklab, var(--color-relay) 40%, transparent)" }
                      : undefined
                  }
                >
                  <div
                    className="size-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: found
                        ? "color-mix(in oklab, var(--color-relay) 16%, transparent)"
                        : "var(--color-secondary)",
                    }}
                  >
                    {found ? (
                      <Sparkles className="size-4" style={{ color: "var(--color-relay)" }} />
                    ) : (
                      <Wand2 className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium capitalize">
                      {w.category}
                      {w.size ? ` · size ${w.size}` : ""}
                      {w.budget ? ` · ≤ ₹${w.budget.toLocaleString("en-IN")}` : ""}
                    </div>
                    {found ? (
                      <div className="text-sm mt-0.5" style={{ color: "var(--color-relay)" }}>
                        ✨ Granted — found {wm.length} match{wm.length > 1 ? "es" : ""}
                        {top?.title ? ` · ${top.title}` : ""}
                        {(() => {
                          const price = top?.list_price ?? top?.price;
                          return price != null ? ` · ₹${price.toLocaleString("en-IN")}` : "";
                        })()}
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Watching for a match — local first, then nationally. We'll grant it the
                        moment a returned item matches.
                      </div>
                    )}
                  </div>
                  {found && top && (
                    <Link
                      to="/ledger/$unitId"
                      params={{ unitId: top.unit_id }}
                      className="text-[11px] text-primary inline-flex items-center gap-1 hover:gap-2 transition-all shrink-0"
                    >
                      View match <ArrowRight className="size-3" />
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      removeMyWish(w.id);
                      deleteMut.mutate(w.id);
                    }}
                    title="Remove wish"
                    aria-label="Remove wish"
                    className="size-7 rounded-full hover:bg-secondary inline-flex items-center justify-center text-muted-foreground shrink-0"
                  >
                    <X className="size-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Prefer to browse?{" "}
        <Link to="/rescue" className="text-primary hover:underline">
          Open the rescue feed →
        </Link>
      </div>
    </div>
  );
}
