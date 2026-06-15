import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, RotateCcw, ChevronRight, Check, Recycle, Repeat } from "lucide-react";
import { categoryImage } from "@/lib/demo-constants";
import { getOrders, resellOrderItem } from "@/lib/relay-api";
import { useSmileNavigate } from "@/components/relay/SmileTransition";
import { ResellDialog } from "@/components/relay/ResellDialog";
import { ExchangeDialog } from "@/components/relay/ExchangeDialog";

export const Route = createFileRoute("/amazon/orders")({
  head: () => ({
    meta: [
      { title: "Your Orders — Amazon" },
      { name: "description", content: "View past orders and start a return or replacement." },
    ],
  }),
  component: OrdersPage,
});

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const t = new Date(d);
  return isNaN(t.getTime())
    ? d
    : t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function OrdersPage() {
  const trigger = useSmileNavigate();
  const qc = useQueryClient();
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders([]),
  });
  // Amazon (Layer-1) orders only — Second-Life / Rescue checkouts live in the
  // Relay dashboard, not the Amazon order list.
  const orders = allOrders.filter((o) => o.source !== "relay");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <h1 className="font-display text-2xl">Your Orders</h1>
      <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
        <span className="border-b-2 border-foreground text-foreground pb-1">Orders</span>
        <span>Buy Again</span>
        <span>Not Yet Shipped</span>
        <span>Cancelled Orders</span>
      </div>

      {isLoading && <div className="mt-8 text-sm text-muted-foreground">Loading orders…</div>}
      {!isLoading && orders.length === 0 && (
        <div className="mt-8 card-soft p-10 text-center text-sm text-muted-foreground">
          No orders yet — check out from the cart and your orders will appear here.
        </div>
      )}

      <div className="mt-6 space-y-4">
        {orders.map((o, oi) => {
          const total = o.total ?? o.subtotal ?? o.items.reduce((s, it) => s + it.price, 0);
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: oi * 0.04 }}
              className="card-soft overflow-hidden"
            >
              <div className="bg-secondary/60 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <div>
                  <div>Order placed</div>
                  <div className="text-foreground normal-case tracking-normal text-sm mt-0.5 tabular">
                    {fmtDate(o.placed_at ?? o.created_at)}
                  </div>
                </div>
                <div>
                  <div>Total</div>
                  <div className="text-foreground normal-case tracking-normal text-sm mt-0.5 tabular">
                    ₹{total.toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div>Ship to</div>
                  <div className="text-foreground normal-case tracking-normal text-sm mt-0.5">
                    You · Bengaluru
                  </div>
                </div>
                <div className="text-right">
                  <div>Order # {o.id.slice(0, 8)}</div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {o.items.map((it) => (
                  <div key={it.id} className="p-5 flex items-center gap-5">
                    <img
                      src={categoryImage(it.category)}
                      alt=""
                      className="size-20 rounded-lg object-cover bg-secondary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-primary inline-flex items-center gap-1.5">
                        <Package className="size-4" /> {o.status ?? "Delivered"}
                      </div>
                      <Link
                        to="/amazon/products/$id"
                        params={{ id: it.product_id }}
                        className="block text-base mt-1 hover:text-primary line-clamp-1"
                      >
                        {it.title}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {it.category ?? "item"}
                        {it.size ? ` · size ${it.size}` : ""} · ₹{it.price.toLocaleString("en-IN")}
                        {it.delivered_at ? ` · delivered ${fmtDate(it.delivered_at)}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {it.listed ? (
                        <Link
                          to="/impact"
                          className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 border transition"
                          style={{
                            color: "var(--color-relay)",
                            borderColor: "color-mix(in oklab, var(--color-relay) 35%, transparent)",
                            background: "color-mix(in oklab, var(--color-relay) 10%, transparent)",
                          }}
                        >
                          <Recycle className="size-3" /> Listed on Second Life
                        </Link>
                      ) : it.returned ? (
                        <Link
                          to="/impact"
                          className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 border border-border bg-secondary text-foreground hover:bg-secondary/70 transition"
                        >
                          <Check className="size-3" />
                          {it.return_state === "return_to_seller" ? "Return to seller" : "Track return"}
                        </Link>
                      ) : it.returnable ? (
                        <>
                          <button
                            onClick={() => trigger(`/returns/new?orderItemId=${it.id}`)}
                            className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 transition border border-border bg-card hover:bg-secondary text-foreground"
                          >
                            <RotateCcw className="size-3" />
                            {typeof it.days_to_return_deadline === "number" &&
                            it.days_to_return_deadline >= 0
                              ? `Return · ${it.days_to_return_deadline}d left`
                              : "Return"}
                          </button>
                          <ExchangeDialog
                            item={it}
                            trigger={
                              <button className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 transition border border-border bg-card hover:bg-secondary text-foreground">
                                <Repeat className="size-3" /> Exchange
                              </button>
                            }
                          />
                        </>
                      ) : it.resellable ? (
                        <ResellDialog
                          title="Resell on Second Life"
                          description="The return window has closed — give this item a second life. Upload a few photos (or a short video) and Relay's AI grades it and suggests a fair price."
                          submit={async (files) => {
                            const listing = await resellOrderItem(it.id, files);
                            qc.invalidateQueries({ queryKey: ["orders"] });
                            qc.invalidateQueries({ queryKey: ["second-life"] });
                            return listing;
                          }}
                          cta="Grade & list it"
                          trigger={
                            <button className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 transition text-primary-foreground bg-primary hover:bg-[var(--color-relay-hover)]">
                              <Recycle className="size-3" /> Resell on Second Life
                            </button>
                          }
                        />
                      ) : (
                        <span className="text-xs rounded-full px-4 py-2 inline-flex items-center gap-1.5 border border-border bg-secondary text-muted-foreground cursor-not-allowed">
                          <RotateCcw className="size-3" /> Return window closed
                        </span>
                      )}
                      <Link
                        to="/amazon/products/$id"
                        params={{ id: it.product_id }}
                        className="text-xs rounded-full px-4 py-2 border border-border bg-card hover:bg-secondary transition inline-flex items-center gap-1.5"
                      >
                        Buy it again <ChevronRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
