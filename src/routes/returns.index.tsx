import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, RotateCcw, ChevronRight } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { getOrders } from "@/lib/relay-api";

export const Route = createFileRoute("/returns/")({
  head: () => ({
    meta: [
      { title: "Start a return — Relay" },
      { name: "description", content: "Pick a delivered order item to return." },
    ],
  }),
  component: ReturnsList,
});

function ReturnsList() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders([]),
  });

  // Only show lines that are genuinely still returnable: within the window, not
  // already returned, not resold/listed, and not in a post-return state.
  const eligible = orders.flatMap((o) =>
    o.items
      .filter((it) => it.returnable && !it.returned && !it.listed && !it.return_state)
      .map((it) => ({ order: o, item: it })),
  );

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Start a return</div>
      <h1 className="font-display text-3xl mt-2">Pick what you'd like to return.</h1>
      <p className="text-muted-foreground mt-2">
        Only items you've actually received can be returned. We'll grade it and route it to its best
        next home.
      </p>

      {isLoading && <div className="mt-8 text-sm text-muted-foreground">Loading your orders…</div>}
      {!isLoading && eligible.length === 0 && (
        <div className="mt-8 card-soft p-10 text-center text-sm text-muted-foreground">
          No returnable items right now.{" "}
          <Link to="/amazon/orders" className="text-primary hover:underline">
            View your orders →
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {eligible.map(({ order, item }, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to="/returns/new"
              search={{ orderItemId: item.id }}
              className="card-soft p-4 flex items-center gap-4 hover:-translate-y-0.5 transition"
            >
              <img
                src={productImage(item.image_url, item.category, item.vertical)}
                alt=""
                className="size-16 rounded-lg object-cover bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-primary inline-flex items-center gap-1.5">
                  <Package className="size-3" /> Delivered
                </div>
                <div className="font-medium mt-0.5 truncate">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 tabular">
                  Order {order.id.slice(0, 8)} · ₹{item.price.toLocaleString("en-IN")}
                  {item.size ? ` · size ${item.size}` : ""}
                </div>
              </div>
              <div className="text-xs font-medium text-primary inline-flex items-center gap-1">
                <RotateCcw className="size-3" /> Return <ChevronRight className="size-3" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
