import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Recycle,
  ShieldCheck,
  Clock,
  ArrowRight,
  Package,
  RotateCcw,
  PackageCheck,
  BadgeCheck,
  Check,
} from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { ResellDialog } from "@/components/relay/ResellDialog";
import { getSellerOrders, relistSellerUnit, type SellerOrderStatus } from "@/lib/relay-api";

export const Route = createFileRoute("/seller/orders")({
  head: () => ({
    meta: [
      { title: "Order history — Relay seller" },
      {
        name: "description",
        content: "Your full sold history with second-life routing and relist actions.",
      },
    ],
  }),
  component: SellerOrders,
});

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function fmtDate(d?: string | null) {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime())
    ? d
    : t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS: Record<
  string,
  { label: string; icon: typeof Package; fg: string; bg: string }
> = {
  delivered: {
    label: "Delivered",
    icon: Package,
    fg: "var(--color-relay)",
    bg: "color-mix(in oklab, var(--color-relay) 12%, transparent)",
  },
  returned: {
    label: "Returned",
    icon: RotateCcw,
    fg: "var(--color-signal)",
    bg: "color-mix(in oklab, var(--color-signal) 14%, transparent)",
  },
  refurbished: {
    label: "Refurbished",
    icon: PackageCheck,
    fg: "var(--color-grade-bplus)",
    bg: "color-mix(in oklab, var(--color-grade-bplus) 16%, transparent)",
  },
  relisted: {
    label: "Relisted",
    icon: Recycle,
    fg: "var(--color-relay)",
    bg: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
  },
  sold: {
    label: "Sold",
    icon: Check,
    fg: "var(--color-muted-foreground)",
    bg: "var(--color-secondary)",
  },
};

function StatusChip({ status }: { status: SellerOrderStatus }) {
  const meta = STATUS[status] ?? {
    label: status,
    icon: Package,
    fg: "var(--color-muted-foreground)",
    bg: "var(--color-secondary)",
  };
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider capitalize"
      style={{ color: meta.fg, background: meta.bg }}
    >
      <Icon className="size-2.5" /> {meta.label}
    </span>
  );
}

function SellerOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => getSellerOrders([]),
  });

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-10">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Seller · order history
      </div>
      <h1 className="font-display text-4xl mt-2">Everything you've sold.</h1>
      <p className="text-muted-foreground mt-2 max-w-xl">
        Your full sold history with live second-life status. When a unit comes back and is graded
        refurbished, relist it as Certified Second-Life — AI-priced and routed to a new owner.
      </p>

      {isLoading && (
        <div className="mt-8 text-sm text-muted-foreground">Loading your order history…</div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="mt-8 card-soft p-10 text-center text-sm text-muted-foreground">
          No sold units yet — your sold history will appear here.
        </div>
      )}

      <div className="mt-8 space-y-3">
        {orders.map((it, i) => {
          const sold = fmtDate(it.sold_at);
          const delivered = fmtDate(it.delivered_at);
          return (
            <motion.div
              key={it.order_item_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              className="card-soft p-4 flex gap-4 items-center"
            >
              <div className="size-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                <img
                  src={productImage(it.image_url, it.category, it.vertical)}
                  alt={it.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusChip status={it.status} />
                  {it.listing_id && (
                    <Link
                      to="/second-life"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium hover:underline"
                      style={{
                        color: "var(--color-grade-bplus)",
                        background: "color-mix(in oklab, var(--color-grade-bplus) 16%, transparent)",
                      }}
                    >
                      <BadgeCheck className="size-2.5" /> Listed on Second Life
                    </Link>
                  )}
                </div>
                <div className="font-medium leading-tight mt-1 line-clamp-1">{it.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {it.category} · {it.vertical} · sold to {it.buyer_label}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap tabular">
                  <span className="text-foreground font-medium">{inr(it.sale_price)}</span>
                  {sold && <span>sold {sold}</span>}
                  {delivered && <span>delivered {delivered}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" /> {it.age_days}d
                  </span>
                </div>
                <Link
                  to="/ledger/$unitId"
                  params={{ unitId: it.unit_id }}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  View on-chain history →
                </Link>
              </div>

              <div className="shrink-0">
                {it.relistable ? (
                  <ResellDialog
                    title="Relist as Certified Second-Life"
                    description="Upload refreshed photos (or a short video). Relay's AI confirms the grade and suggests a fair list price, then publishes a Certified Second-Life listing."
                    cta="Grade & relist"
                    submit={async (files) => {
                      const listing = await relistSellerUnit(it.unit_id, files);
                      qc.invalidateQueries({ queryKey: ["seller-orders"] });
                      qc.invalidateQueries({ queryKey: ["seller-refurbished"] });
                      qc.invalidateQueries({ queryKey: ["second-life"] });
                      return listing;
                    }}
                    trigger={
                      <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-2 bg-primary text-primary-foreground hover:bg-[var(--color-relay-hover)] transition">
                        <Recycle className="size-3.5" /> Relist for resale
                      </button>
                    }
                  />
                ) : it.listing_id ? (
                  <Link
                    to="/second-life"
                    className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-2 border border-border bg-card hover:bg-secondary transition"
                  >
                    View listing <ArrowRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="text-muted-foreground inline-flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary" /> Every sale & relist is anchored on the
          LifeLedger.
        </div>
        <Link
          to="/second-life"
          className="text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
        >
          See live Second-Life listings <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
