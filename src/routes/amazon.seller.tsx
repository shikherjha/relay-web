import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Package, RotateCcw } from "lucide-react";
import { useSmileNavigate } from "@/components/relay/SmileTransition";
import { AnimatedCounter } from "@/components/relay/AnimatedCounter";

export const Route = createFileRoute("/amazon/seller")({
  head: () => ({ meta: [{ title: "Seller Central — Amazon" }] }),
  component: SellerHome,
});

function SellerHome() {
  const trigger = useSmileNavigate();
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Seller Central</div>
      <h1 className="font-display text-2xl mt-1">Good morning, NorthStar Apparel</h1>
      <p className="text-sm text-muted-foreground mt-1">Selling NEW inventory across Amazon.in</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <KPI label="Sales · 30d" value={1284900} prefix="₹" />
        <KPI label="Units sold" value={3217} />
        <KPI label="Return rate" value={14.2} decimals={1} suffix="%" />
      </div>

      <motion.button
        onClick={() => trigger("/ops")}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="mt-6 w-full text-left card-soft p-6 relative overflow-hidden flex items-center gap-5"
        style={{
          background:
            "linear-gradient(110deg, var(--color-card) 55%, color-mix(in oklab, var(--color-card) 75%, #0F6B4F))",
        }}
      >
        <div className="size-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
          <RotateCcw className="size-6" />
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Action needed
          </div>
          <div className="font-display text-xl mt-1">
            You have <span className="text-primary">412 returns</span> to route
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Open Relay Ops to recover value: re-grade, route hyperlocal, refurb, or recycle.
          </div>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open Relay Ops <ArrowRight className="size-4" />
        </div>
      </motion.button>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Tile
          icon={<Package className="size-4" />}
          title="Manage inventory"
          desc="Catalog · pricing · listings"
        />
        <Tile
          icon={<BarChart3 className="size-4" />}
          title="Reports"
          desc="Sales performance, ads, payouts"
        />
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  return (
    <div className="card-soft p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-display text-2xl tabular mt-1">
        {prefix}
        <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  );
}

function Tile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-soft p-5 flex items-start gap-3">
      <div className="size-9 rounded-lg bg-secondary flex items-center justify-center">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}
