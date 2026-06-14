import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShoppingBag, X, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { categoryImage } from "@/lib/demo-constants";
import { getCart, getProducts } from "@/lib/relay-api";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Relay" }, { name: "description", content: "Your bag with bracketing interceptor." }] }),
  component: CartPage,
});

function CartPage() {
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart({ user_id: "", items: [], bracketing: [] }),
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const items = cart?.items ?? [];
  const bracketing = (cart?.bracketing ?? []).filter((b) => b.flagged);
  const total = items.reduce((sum, c) => sum + (byId.get(c.product_id)?.price ?? 0), 0);

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your bag</div>
      <h1 className="font-display text-4xl mt-2">Cart</h1>

      <AnimatePresence>
        {bracketing.map((b) => {
          const product = byId.get(b.product_id);
          return (
            <motion.div
              key={b.product_id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mt-6 rounded-2xl border-2 border-[var(--color-signal)]/40 bg-[color-mix(in_oklab,var(--color-signal)_10%,transparent)] p-5"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--color-signal)", color: "var(--color-signal-foreground)" }}>
                  <AlertTriangle className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-signal)" }}>Bracketing detected</div>
                  <p className="text-sm mt-1 leading-relaxed">{b.message}</p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-card border border-border inline-flex items-center gap-1.5">
                      <Sparkles className="size-3" style={{ color: "var(--color-signal)" }} /> Suggested size: <strong>{b.suggested_size}</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">Sizes in cart: {b.sizes.join(", ")}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-3">Advisory — checkout not blocked. {product?.title ?? "This item"} returns add ~2.4 kg CO₂ each.</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="mt-8 card-soft divide-y divide-border">
        {items.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <ShoppingBag className="size-8 mx-auto opacity-40" />
            <div className="mt-3 text-sm">Your bag is empty.</div>
          </div>
        )}
        {items.map((c) => {
          const product = byId.get(c.product_id);
          if (!product) return null;
          return (
            <motion.div key={c.id} layout className="flex items-center gap-4 p-4">
              <img src={categoryImage(product.category, product.vertical)} alt="" className="size-16 rounded-lg object-cover bg-secondary" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{(product.metadata as { brand?: string })?.brand ?? product.sku}</div>
                <div className="text-sm font-medium">{product.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Size {c.size}</div>
              </div>
              <div className="text-sm tabular font-medium">₹{product.price.toLocaleString("en-IN")}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Subtotal</div>
        <div className="font-display text-xl tabular">₹{total.toLocaleString("en-IN")}</div>
      </div>
      <button className="mt-4 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-[var(--color-relay-hover)] transition active:scale-[0.99]">
        Checkout
      </button>
      <div className="text-center text-xs text-muted-foreground mt-3">Free 14-day exchange · <Link to="/rescue" className="text-primary hover:underline">Or rescue one nearby instead →</Link></div>
    </div>
  );
}
