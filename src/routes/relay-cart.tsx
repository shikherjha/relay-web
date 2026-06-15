import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, X, Loader2, MapPin, Truck, Recycle, ShieldCheck } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { relayCheckout, type RelayCheckoutItem } from "@/lib/relay-api";
import { useRelay, type RelayCartItem } from "@/lib/store";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/relay-cart")({
  head: () => ({
    meta: [
      { title: "Cart — Relay second-life" },
      {
        name: "description",
        content: "Your Second-Life and Rescue picks, ready for an escrow-protected checkout.",
      },
    ],
  }),
  component: RelayCartPage,
});

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function KindBadge({ item }: { item: RelayCartItem }) {
  const rescue = item.kind === "rescue";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: rescue
          ? "color-mix(in oklab, var(--color-signal) 14%, transparent)"
          : "color-mix(in oklab, var(--color-relay) 14%, transparent)",
        color: rescue ? "var(--color-signal)" : "var(--color-relay)",
      }}
    >
      {rescue ? <MapPin className="size-2.5" /> : <Recycle className="size-2.5" />}
      {rescue ? "Rescue" : "Second Life"}
    </span>
  );
}

function RelayCartPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const relayCart = useRelay((s) => s.relayCart);
  const removeFromRelayCart = useRelay((s) => s.removeFromRelayCart);
  const clearRelayCart = useRelay((s) => s.clearRelayCart);

  const total = relayCart.reduce((sum, c) => sum + (c.price ?? 0), 0);

  const checkoutMut = useMutation({
    mutationFn: () => {
      const items: RelayCheckoutItem[] = relayCart.map((c) => ({
        kind: c.kind,
        listing_id: c.listingId,
      }));
      return relayCheckout(items);
    },
    onSuccess: async () => {
      clearRelayCart();
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["orders"] }),
        qc.invalidateQueries({ queryKey: ["impact"] }),
        qc.invalidateQueries({ queryKey: ["second-life"] }),
        qc.invalidateQueries({ queryKey: ["rescue-feed"] }),
        qc.invalidateQueries({ queryKey: ["my-resales"] }),
      ]);
      navigate({ to: "/impact", search: { tab: "orders" } });
    },
  });

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your Relay bag</div>
      <h1 className="font-display text-4xl mt-2">Cart</h1>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm">
        Second-Life resells and nearby Rescue finds — every one AI-graded and ownership-transferred
        on the LifeLedger at checkout.
      </p>

      <div className="mt-8 card-soft divide-y divide-border">
        {relayCart.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <ShoppingBag className="size-8 mx-auto opacity-40" />
            <div className="mt-3 text-sm">Your bag is empty.</div>
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <Link to="/second-life" className="text-primary hover:underline">
                Browse Second Life →
              </Link>
              <Link to="/rescue" className="text-primary hover:underline">
                Rescue something nearby →
              </Link>
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {relayCart.map((c) => (
            <motion.div
              key={c.listingId}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-4 p-4"
            >
              <Link to="/ledger/$unitId" params={{ unitId: c.unitId }} className="shrink-0">
                <img
                  src={productImage(c.imageUrl, c.category, c.vertical)}
                  alt={c.title}
                  loading="lazy"
                  className="size-16 rounded-lg object-cover bg-secondary"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <KindBadge item={c} />
                  {c.grade && <GradeBadge grade={c.grade as Grade} size="sm" />}
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    {c.ships ? <Truck className="size-3" /> : <MapPin className="size-3" />}
                    {c.ships ? "Ships to you" : "Local pickup"}
                  </span>
                </div>
                <Link
                  to="/ledger/$unitId"
                  params={{ unitId: c.unitId }}
                  className="block text-sm font-medium mt-1 line-clamp-1 hover:text-primary"
                >
                  {c.title}
                </Link>
                {c.category && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {c.category}
                    {c.vertical ? ` · ${c.vertical}` : ""}
                  </div>
                )}
              </div>
              <div className="text-sm tabular font-medium shrink-0">{inr(c.price)}</div>
              <button
                onClick={() => removeFromRelayCart(c.listingId)}
                aria-label={`Remove ${c.title}`}
                className="size-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition shrink-0"
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" /> Escrow-protected · {relayCart.length}{" "}
          item{relayCart.length === 1 ? "" : "s"}
        </div>
        <div className="font-display text-xl tabular">{inr(total)}</div>
      </div>

      <button
        onClick={() => checkoutMut.mutate()}
        disabled={checkoutMut.isPending || relayCart.length === 0}
        className="mt-4 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-[var(--color-relay-hover)] transition active:scale-[0.99] disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {checkoutMut.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Releasing escrow…
          </>
        ) : (
          "Checkout · release escrow"
        )}
      </button>
      {checkoutMut.isError && (
        <div className="text-center text-xs text-red-600 mt-2">
          Checkout failed — some items may have just sold. Refresh and try again.
        </div>
      )}
      <div className="text-center text-xs text-muted-foreground mt-3">
        Tracked in your{" "}
        <Link to="/impact" search={{ tab: "orders" }} className="text-primary hover:underline">
          Relay orders →
        </Link>
      </div>
    </div>
  );
}
