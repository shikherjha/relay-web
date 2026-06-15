import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package,
  RotateCcw,
  Recycle,
  MapPin,
  Truck,
  Camera,
  Clock,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GradeBadge } from "./GradeBadge";
import { productImage } from "@/lib/demo-constants";
import {
  getMyResales,
  getMyReturns,
  getOrders,
  type ResaleTrackingDTO,
  type ReturnTrackingDTO,
} from "@/lib/relay-api";
import type { Grade } from "@/lib/mock-data";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function fmtDate(d?: string | null) {
  if (!d) return null;
  const t = new Date(d);
  return isNaN(t.getTime())
    ? d
    : t.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const RETURN_STATUS: Record<string, { label: string; fg: string; bg: string }> = {
  initiated: {
    label: "Pickup pending",
    fg: "var(--color-signal)",
    bg: "color-mix(in oklab, var(--color-signal) 14%, transparent)",
  },
  picked_up: {
    label: "Picked up",
    fg: "var(--color-signal)",
    bg: "color-mix(in oklab, var(--color-signal) 14%, transparent)",
  },
  graded: {
    label: "AI graded",
    fg: "var(--color-relay)",
    bg: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
  },
  flagged: {
    label: "Return to seller",
    fg: "var(--color-muted-foreground)",
    bg: "var(--color-secondary)",
  },
};

function nextHome(r: ReturnTrackingDTO): { label: string; icon: typeof MapPin } | null {
  if (r.rescue_listed) return { label: "Live on the Rescue feed nearby", icon: MapPin };
  if (r.second_life_listed) return { label: "Listed on Second Life", icon: Recycle };
  if (r.disposition_channel === "refurb" || r.disposition_channel === "refurbish")
    return { label: "Routed to refurbishment", icon: Truck };
  if (r.status === "graded") return { label: "Graded — routing to its next home", icon: Clock };
  return null;
}

function MediaStrip({ urls }: { urls?: string[] }) {
  const media = (urls ?? []).slice(0, 4);
  if (media.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <Camera className="size-3 text-muted-foreground shrink-0" />
      {media.map((u, i) => (
        <span key={i} className="size-9 rounded-md overflow-hidden bg-secondary border border-border">
          <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
        </span>
      ))}
    </div>
  );
}

export function BuyerActivity() {
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => getOrders([]) });
  const { data: returns = [] } = useQuery({
    queryKey: ["my-returns"],
    queryFn: () => getMyReturns([]),
  });
  const { data: resales = [] } = useQuery({
    queryKey: ["my-resales"],
    queryFn: () => getMyResales([]),
  });

  return (
    <section className="mt-12">
      <h2 className="font-display text-xl mb-1">Your Relay activity</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Track your orders, follow each return to its next home, and watch your Second-Life resells.
      </p>

      <Tabs defaultValue="returns">
        <TabsList>
          <TabsTrigger value="returns">
            Returns{returns.length ? ` · ${returns.length}` : ""}
          </TabsTrigger>
          <TabsTrigger value="resells">
            Resells{resales.length ? ` · ${resales.length}` : ""}
          </TabsTrigger>
          <TabsTrigger value="orders">Orders{orders.length ? ` · ${orders.length}` : ""}</TabsTrigger>
        </TabsList>

        {/* ── Returns tracking ───────────────────────────────────────────── */}
        <TabsContent value="returns">
          {returns.length === 0 ? (
            <EmptyState
              icon={RotateCcw}
              text="No returns yet. When you return a delivered item, you can follow it from pickup to its next home here."
            />
          ) : (
            <div className="space-y-3 mt-3">
              {returns.map((r, i) => {
                const status = RETURN_STATUS[r.status] ?? {
                  label: r.status,
                  fg: "var(--color-muted-foreground)",
                  bg: "var(--color-secondary)",
                };
                const home = nextHome(r);
                return (
                  <motion.div
                    key={r.return_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.03 }}
                    className="card-soft p-4 flex gap-4 items-start"
                  >
                    <Link to="/ledger/$unitId" params={{ unitId: r.unit_id }} className="shrink-0">
                      <img
                        src={productImage(r.image_url, r.category, r.vertical)}
                        alt={r.title ?? ""}
                        loading="lazy"
                        className="size-16 rounded-lg object-cover bg-secondary"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                          style={{ color: status.fg, background: status.bg }}
                        >
                          {r.status === "graded" ? (
                            <CheckCircle2 className="size-2.5" />
                          ) : (
                            <Clock className="size-2.5" />
                          )}
                          {status.label}
                        </span>
                        {r.grade && <GradeBadge grade={r.grade as Grade} size="sm" />}
                        {r.reason_code && (
                          <span className="text-[11px] text-muted-foreground capitalize">
                            · {r.reason_code.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <Link
                        to="/ledger/$unitId"
                        params={{ unitId: r.unit_id }}
                        className="block font-medium leading-tight mt-1 line-clamp-1 hover:text-primary"
                      >
                        {r.title ?? "Returned item"}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Requested {fmtDate(r.created_at) ?? "recently"}
                      </div>
                      {home && (
                        <div
                          className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1"
                          style={{
                            color: "var(--color-relay)",
                            background: "color-mix(in oklab, var(--color-relay) 10%, transparent)",
                          }}
                        >
                          <home.icon className="size-3" /> {home.label}
                        </div>
                      )}
                      <MediaStrip urls={r.media_urls} />
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <Link
                        to="/ledger/$unitId"
                        params={{ unitId: r.unit_id }}
                        className="text-[11px] text-primary hover:underline whitespace-nowrap"
                      >
                        Passport →
                      </Link>
                      {r.rescue_listed && (
                        <Link
                          to="/rescue"
                          className="text-[11px] text-primary hover:underline whitespace-nowrap"
                        >
                          View on Rescue →
                        </Link>
                      )}
                      {r.second_life_listed && (
                        <Link
                          to="/second-life"
                          className="text-[11px] text-primary hover:underline whitespace-nowrap"
                        >
                          View on Second Life →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── P2P resell tracking ────────────────────────────────────────── */}
        <TabsContent value="resells">
          {resales.length === 0 ? (
            <EmptyState
              icon={Recycle}
              text="No resells yet. Once an item's return window closes, resell it on Second Life from your orders — it'll show up here with live status."
            />
          ) : (
            <div className="space-y-3 mt-3">
              {resales.map((r, i) => (
                <ResaleRow key={r.listing_id} r={r} i={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Order history ──────────────────────────────────────────────── */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingBag} text="No orders yet." />
          ) : (
            <div className="space-y-3 mt-3">
              {orders.map((o, oi) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(oi, 10) * 0.03 }}
                  className="card-soft overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-secondary/50 border-b border-border text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="size-3" /> Order {o.id.slice(0, 8)}
                    </span>
                    <span className="tabular">{fmtDate(o.created_at)}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {o.items.map((it) => (
                      <div key={it.id} className="px-4 py-3 flex items-center gap-3">
                        <Link
                          to="/ledger/$unitId"
                          params={{ unitId: it.unit_id ?? it.id }}
                          className="shrink-0"
                        >
                          <img
                            src={productImage(it.image_url, it.category, it.vertical)}
                            alt=""
                            loading="lazy"
                            className="size-12 rounded-lg object-cover bg-secondary"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-1">{it.title}</div>
                          <div className="text-xs text-muted-foreground tabular">
                            {it.price != null ? inr(it.price) : ""}
                            {it.size ? ` · size ${it.size}` : ""}
                          </div>
                        </div>
                        <OrderItemChip
                          listed={it.listed}
                          returned={it.returned}
                          returnState={it.return_state}
                          resellable={it.resellable}
                          days={it.days_to_return_deadline}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ResaleRow({ r, i }: { r: ResaleTrackingDTO; i: number }) {
  const sold = r.status === "sold";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 10) * 0.03 }}
      className="card-soft p-4 flex gap-4 items-start"
    >
      <Link to="/ledger/$unitId" params={{ unitId: r.unit_id }} className="shrink-0">
        <img
          src={productImage(r.image_url, r.category, r.vertical)}
          alt={r.title ?? ""}
          loading="lazy"
          className="size-16 rounded-lg object-cover bg-secondary"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
            style={
              sold
                ? {
                    color: "var(--color-muted-foreground)",
                    background: "var(--color-secondary)",
                  }
                : {
                    color: "var(--color-relay)",
                    background: "color-mix(in oklab, var(--color-relay) 14%, transparent)",
                  }
            }
          >
            {sold ? <CheckCircle2 className="size-2.5" /> : <Recycle className="size-2.5" />}
            {sold ? "Sold · escrow released" : "Listed · active"}
          </span>
          {r.resale_grade && <GradeBadge grade={r.resale_grade as Grade} size="sm" />}
        </div>
        <Link
          to="/ledger/$unitId"
          params={{ unitId: r.unit_id }}
          className="block font-medium leading-tight mt-1 line-clamp-1 hover:text-primary"
        >
          {r.title ?? "Resale listing"}
        </Link>
        <div className="text-xs text-muted-foreground mt-0.5 tabular">
          {r.list_price != null ? inr(r.list_price) : ""}
          {r.age_days != null ? ` · ${r.age_days}d old` : ""}
        </div>
        <MediaStrip urls={r.media_urls} />
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <Link to="/second-life" className="text-[11px] text-primary hover:underline whitespace-nowrap">
          {sold ? "View on Second Life →" : "View listing →"}
        </Link>
        <Link
          to="/ledger/$unitId"
          params={{ unitId: r.unit_id }}
          className="text-[11px] text-primary hover:underline whitespace-nowrap"
        >
          Passport →
        </Link>
      </div>
    </motion.div>
  );
}

function OrderItemChip({
  listed,
  returned,
  returnState,
  resellable,
  days,
}: {
  listed?: boolean;
  returned?: boolean;
  returnState?: string | null;
  resellable?: boolean;
  days?: number | null;
}) {
  let label = "Delivered";
  let icon = Package;
  if (listed) {
    label = "Resold";
    icon = Recycle;
  } else if (returnState === "return_to_seller") {
    label = "Return to seller";
    icon = Truck;
  } else if (returned) {
    label = "Returned";
    icon = RotateCcw;
  } else if (resellable) {
    label = "Resell available";
    icon = Recycle;
  } else if (typeof days === "number" && days >= 0) {
    label = `${days}d to return`;
    icon = Clock;
  } else {
    label = "Window closed";
    icon = Clock;
  }
  const Icon = icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border border-border bg-secondary/60 text-muted-foreground whitespace-nowrap">
      <Icon className="size-2.5" /> {label}
    </span>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Package; text: string }) {
  return (
    <div className="card-soft p-8 mt-3 text-center">
      <div className="size-10 rounded-full bg-secondary flex items-center justify-center mx-auto">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">{text}</p>
    </div>
  );
}
