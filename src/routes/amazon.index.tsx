import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Star, ShieldCheck } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { getProducts } from "@/lib/relay-api";
import { useSmileNavigate } from "@/components/relay/SmileTransition";
import { SmileLogo } from "@/components/relay/SmileLogo";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/amazon/")({
  head: () => ({
    meta: [
      { title: "Amazon.in — Shop new" },
      { name: "description", content: "Amazon storefront with Relay second-life inside." },
    ],
  }),
  component: AmazonHome,
});

function brandOf(p: { metadata?: Record<string, unknown> | null; vertical: string }) {
  return (p.metadata as { brand?: string } | null | undefined)?.brand ?? p.vertical;
}

function AmazonHome() {
  const trigger = useSmileNavigate();
  const persona = useRelay((s) => s.persona);
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const grid = products.slice(0, 4);
  const recommended = products.slice(0, 8);

  // Seller persona's Layer-1 home IS Seller Central, not the buyer storefront.
  if (persona === "seller") return <Navigate to="/amazon/seller" replace />;

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 space-y-6">
      {/* hero strip with category cards (Amazon-home style) */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {grid.map((p, i) => (
          <Link
            key={p.id}
            to="/amazon/products/$id"
            params={{ id: p.id }}
            className="card-soft p-4 block hover:-translate-y-0.5 transition"
          >
            <div className="text-base font-medium leading-tight">
              {i === 0
                ? "Top picks for you"
                : i === 1
                  ? "Refresh your wardrobe"
                  : i === 2
                    ? "Tech we'd buy"
                    : "Daily essentials"}
            </div>
            <div className="mt-3 aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
              <img
                src={productImage(p.image_url, p.category, p.vertical)}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="mt-3 text-xs text-primary inline-flex items-center gap-1">
              Shop now <ChevronRight className="size-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Relay cross-sell banner — primary smile-transition entry */}
      <motion.button
        onClick={() => trigger("/")}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.005 }}
        className="w-full text-left card-soft p-6 relative overflow-hidden flex items-center gap-6"
        style={{
          background:
            "linear-gradient(110deg, var(--color-card) 60%, color-mix(in oklab, var(--color-card) 70%, #0F6B4F))",
        }}
      >
        <div
          className="size-16 rounded-2xl flex items-center justify-center"
          style={{ background: "color-mix(in oklab, #0F6B4F 16%, transparent)" }}
        >
          <SmileLogo size={56} color="#0F6B4F" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Inside Amazon
          </div>
          <div className="font-display text-2xl mt-1">Relay — every product's second life</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Returned items, condition-passported and routed to a buyer near you — before they reach
            a warehouse. Save up to 60% on verified pieces.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary">
          Open Relay <ChevronRight className="size-4" />
        </div>
      </motion.button>

      {/* Recommended grid */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-xl">Recommended for you</h2>
          <Link to="/amazon" className="text-xs text-primary hover:underline">
            See more
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recommended.map((p) => (
            <Link
              key={p.id}
              to="/amazon/products/$id"
              params={{ id: p.id }}
              className="card-soft p-3 hover:-translate-y-0.5 transition"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-secondary">
                <img
                  src={productImage(p.image_url, p.category, p.vertical)}
                  alt={p.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-sm mt-2 line-clamp-2">
                {brandOf(p)} {p.title}
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-1 text-muted-foreground">
                <Star className="size-3 fill-[#FFA41C] text-[#FFA41C]" /> 4.
                {(p.id.charCodeAt(0) % 5) + 3} · 1,2{p.id.charCodeAt(1) % 9}k
              </div>
              <div className="font-display text-base tabular mt-1">
                ₹{p.price.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-primary mt-1 inline-flex items-center gap-1">
                <ShieldCheck className="size-3" /> Eligible for return
              </div>
            </Link>
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No products loaded yet — check that relay-api is running.
          </p>
        )}
      </section>
    </div>
  );
}
