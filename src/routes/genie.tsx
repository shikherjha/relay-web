import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Sparkles,
  ArrowRight,
  X,
  Wand2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteWish, getWishes, getWishMatches, postWish } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/genie")({
  head: () => ({
    meta: [
      { title: "Genie - Tell Relay what you want" },
      {
        name: "description",
        content:
          "Post a wish. Relay grants it the moment a returned item matches - before it goes anywhere else.",
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
  const [expandedWishId, setExpandedWishId] = useState<string | null>(null);

  const { data: matches = [] } = useQuery({
    queryKey: ["wish-matches", userId],
    queryFn: () => getWishMatches([]),
  });

  // Backend is the source of truth for "Your wishes"; local optimistic wishes are merged on top.
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
        We'll notify you the moment a returned item matches - local first, then nationally via
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
            placeholder="Budget INR"
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
              const expanded = expandedWishId === w.id;

              return (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="card-soft p-4 relative"
                  style={
                    found
                      ? { borderColor: "color-mix(in oklab, var(--color-relay) 40%, transparent)" }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-4">
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
                        {w.size ? ` - size ${w.size}` : ""}
                        {w.budget ? ` - <= INR ${w.budget.toLocaleString("en-IN")}` : ""}
                      </div>
                      {found ? (
                        <div className="text-sm mt-0.5" style={{ color: "var(--color-relay)" }}>
                          Granted - found {wm.length} match{wm.length > 1 ? "es" : ""}
                          {top?.title ? ` - ${top.title}` : ""}
                          {(() => {
                            const price = top?.list_price ?? top?.price;
                            return price != null ? ` - INR ${price.toLocaleString("en-IN")}` : "";
                          })()}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Watching for a match - local first, then nationally. We'll grant it the
                          moment a returned item matches.
                        </div>
                      )}
                    </div>
                    {found && (
                      <button
                        type="button"
                        onClick={() => setExpandedWishId(expanded ? null : w.id)}
                        aria-expanded={expanded}
                        className="text-[11px] text-primary inline-flex items-center gap-1 hover:gap-2 transition-all shrink-0"
                      >
                        {wm.length > 1 ? "View matches" : "View match"}
                        {expanded ? (
                          <ChevronUp className="size-3" />
                        ) : (
                          <ChevronDown className="size-3" />
                        )}
                      </button>
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
                  </div>

                  <AnimatePresence initial={false}>
                    {found && expanded && (
                      <motion.div
                        key="matches"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 border-t border-border pt-3 space-y-2">
                          {wm.map((match, index) => {
                            const price = match.list_price ?? match.price;

                            return (
                              <div
                                key={`${match.unit_id}-${index}`}
                                className="rounded-xl border border-border bg-secondary/40 px-3 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">
                                    {match.title ?? "Matched item"}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                    {match.grade ? <span>Grade {match.grade}</span> : null}
                                    {match.scope ? (
                                      <span className="capitalize">{match.scope}</span>
                                    ) : null}
                                    {match.fulfillment ? (
                                      <span className="capitalize">
                                        {match.fulfillment.replaceAll("_", " ")}
                                      </span>
                                    ) : null}
                                    {match.distance_km != null ? (
                                      <span>{match.distance_km.toFixed(1)} km</span>
                                    ) : null}
                                    {price != null ? (
                                      <span>INR {price.toLocaleString("en-IN")}</span>
                                    ) : null}
                                  </div>
                                </div>
                                <Link
                                  to="/ledger/$unitId"
                                  params={{ unitId: match.unit_id }}
                                  className="self-start sm:self-center text-[11px] text-primary inline-flex items-center gap-1 hover:gap-2 transition-all shrink-0"
                                >
                                  Open <ArrowRight className="size-3" />
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-12 text-center text-xs text-muted-foreground">
        Prefer to browse?{" "}
        <Link to="/rescue" className="text-primary hover:underline">
          Open the rescue feed
        </Link>
      </div>
    </div>
  );
}
