import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, RotateCcw, Sparkles, Star, Truck } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { getProduct, postCart } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/amazon/products/$id")({
  head: () => ({ meta: [{ title: "Product — Amazon" }] }),
  component: AmazonPDP,
});

function AmazonPDP() {
  const { id } = useParams({ from: "/amazon/products/$id" });
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });
  const { addToCart, cart } = useRelay();
  const [size, setSize] = useState("M");

  const addMut = useMutation({
    mutationFn: (s: string) => postCart({ product_id: id, size: s, qty: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading)
    return <div className="p-12 max-w-[1200px] mx-auto text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-12 max-w-[1200px] mx-auto">Product not found.</div>;

  const brand = (p.metadata as { brand?: string } | null | undefined)?.brand ?? p.vertical;
  const isFashion = p.vertical === "fashion";
  const sizes = isFashion ? ["XS", "S", "M", "L", "XL"] : null;
  const fitFlags = p.fit_flags?.flags ?? [];
  const originalPrice = (p.metadata as { original_price?: number } | null | undefined)
    ?.original_price;

  const inCart = cart.filter((c) => c.productId === p.id);
  const distinct = new Set(inCart.map((c) => c.size)).size;

  const onAdd = () => {
    addToCart({ productId: p.id, size });
    addMut.mutate(size);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <nav className="text-xs text-muted-foreground">
        <Link to="/amazon" className="hover:underline">
          Home
        </Link>{" "}
        › {p.category} › {brand}
      </nav>

      <div className="grid lg:grid-cols-[1fr_1.1fr_320px] gap-8 mt-4">
        <div>
          <div className="rounded-xl overflow-hidden bg-secondary aspect-square">
            <img
              src={productImage(p.image_url, p.category, p.vertical)}
              alt={p.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Visit the {brand} Store</div>
          <h1 className="text-2xl font-medium mt-1">
            {brand} {p.title}
          </h1>
          <div className="flex items-center gap-1 mt-1 text-sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="size-3.5 fill-[#FFA41C] text-[#FFA41C]" />
            ))}
            <span className="text-primary ml-1">1,284 ratings</span>
          </div>
          <hr className="my-4 border-border" />
          <div className="flex items-baseline gap-2">
            <span className="text-3xl tabular">₹{p.price.toLocaleString("en-IN")}</span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through tabular">
                M.R.P.: ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <p className="text-sm mt-4 leading-relaxed">
            {p.category} · {p.vertical}
          </p>

          {/* Fit guidance from the catalog fit_flags — predictive return prevention */}
          {fitFlags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-xl border p-3.5 flex items-start gap-3"
              style={{
                borderColor: "color-mix(in oklab, var(--color-signal) 35%, transparent)",
                background: "color-mix(in oklab, var(--color-signal) 8%, transparent)",
              }}
            >
              <Sparkles
                className="size-4 mt-0.5 shrink-0"
                style={{ color: "var(--color-signal)" }}
              />
              <div className="text-sm leading-relaxed">
                <strong>Fit tip.</strong>{" "}
                {fitFlags[0].message ?? fitFlags[0].type.replace(/_/g, " ")}
              </div>
            </motion.div>
          )}

          {sizes && (
            <div className="mt-5">
              <div className="text-sm font-medium mb-2">
                Size: <span className="text-muted-foreground">{size}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`size-10 rounded-lg border text-sm transition ${size === s ? "border-foreground bg-secondary" : "border-border hover:border-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right buy box */}
        <aside className="card-soft p-5 h-fit space-y-3">
          <div className="text-2xl tabular">₹{p.price.toLocaleString("en-IN")}</div>
          <div className="text-xs text-primary inline-flex items-center gap-1">
            <Truck className="size-3" /> FREE delivery tomorrow
          </div>
          <div className="text-xs text-muted-foreground">In stock · Sold by {brand} Retail</div>

          {distinct >= 3 && (
            <div
              className="rounded-lg border p-3 flex items-start gap-2 text-xs leading-relaxed"
              style={{
                borderColor: "color-mix(in oklab, var(--color-signal) 35%, transparent)",
                background: "color-mix(in oklab, var(--color-signal) 8%, transparent)",
              }}
            >
              <AlertTriangle
                className="size-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--color-signal)" }}
              />
              <span>
                You've added {distinct} sizes of this item. Most multi-size orders end in a return —
                keep the one that fits.{" "}
                <Link to="/cart" className="text-primary hover:underline">
                  Review cart →
                </Link>
              </span>
            </div>
          )}

          <button
            onClick={onAdd}
            className="w-full py-2.5 rounded-full text-sm font-medium"
            style={{ background: "#FFD814", color: "#0F1111" }}
          >
            Add to bag
          </button>
          <Link
            to="/cart"
            className="block text-center w-full py-2.5 rounded-full text-sm font-medium"
            style={{ background: "#FFA41C", color: "#0F1111" }}
          >
            Go to cart
          </Link>
          <button className="w-full py-2 rounded-full text-sm border border-border hover:bg-secondary transition inline-flex items-center justify-center gap-1.5">
            <RotateCcw className="size-3.5" /> Save for later
          </button>
          <div className="text-[11px] text-muted-foreground pt-2 border-t border-border">
            14-day free return. If returned, Relay routes it to a nearby buyer instead of a
            landfill.
          </div>
        </aside>
      </div>
    </div>
  );
}
