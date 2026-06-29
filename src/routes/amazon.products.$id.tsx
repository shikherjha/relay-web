import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertTriangle, Info, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { getProduct, getProductReturnConfidence, postCart } from "@/lib/relay-api";
import type { FitAxis } from "@/lib/relay-api";
import { FitProfileSelector } from "@/components/relay/FitProfileSelector";
import { FitForPurpose } from "@/components/relay/FitForPurpose";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/amazon/products/$id")({
  head: () => ({ meta: [{ title: "Product — Amazon" }] }),
  component: AmazonPDP,
});

// Which fit axis a category belongs to (mirrors the backend _FIT_AXIS map).
const FIT_AXIS: Record<string, FitAxis> = {
  jeans: "bottoms", pants: "bottoms", trousers: "bottoms", shorts: "bottoms", skirt: "bottoms",
  sneakers: "shoes", shoes: "shoes", footwear: "shoes",
};
const SIZE_OPTS: Record<FitAxis, string[]> = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  bottoms: ["28", "30", "32", "34", "36", "38", "40"],
  shoes: ["6", "7", "8", "9", "10", "11", "12"],
};
const DEFAULT_SIZE: Record<FitAxis, string> = { tops: "M", bottoms: "32", shoes: "9" };
const axisFor = (cat?: string | null): FitAxis => FIT_AXIS[(cat || "").toLowerCase()] ?? "tops";

function AmazonPDP() {
  const { id } = useParams({ from: "/amazon/products/$id" });
  const qc = useQueryClient();
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });
  const { addToCart, cart, fitProfileId } = useRelay();
  const [size, setSize] = useState("M");

  // Keep the selected size valid for the product's axis (e.g. jeans → "32").
  useEffect(() => {
    if (!p || p.vertical !== "fashion") return;
    const opts = SIZE_OPTS[axisFor(p.category)];
    setSize((cur) => (opts.includes(cur) ? cur : DEFAULT_SIZE[axisFor(p.category)]));
  }, [p]);

  const addMut = useMutation({
    // New cart lines inherit the active "shopping for" recipient (per-line in cart).
    mutationFn: (s: string) =>
      postCart({ product_id: id, size: s, qty: 1, profile_id: fitProfileId || "self" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-confidence"] });
    },
  });

  // Return Confidence for the current product/size/profile (refetches on change).
  const { data: confidence } = useQuery({
    queryKey: ["product-confidence", id, size, fitProfileId],
    queryFn: () => getProductReturnConfidence(id, size, fitProfileId),
  });

  if (isLoading)
    return <div className="p-12 max-w-[1200px] mx-auto text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-12 max-w-[1200px] mx-auto">Product not found.</div>;

  const brand = (p.metadata as { brand?: string } | null | undefined)?.brand ?? p.vertical;
  const isFashion = p.vertical === "fashion";
  const axis = axisFor(p.category);
  const sizes = isFashion ? SIZE_OPTS[axis] : null;
  const originalPrice = (p.metadata as { original_price?: number } | null | undefined)
    ?.original_price;

  const inCart = cart.filter((c) => c.productId === p.id);
  const distinct = new Set(inCart.map((c) => c.size)).size;

  const item = confidence?.items?.[0];
  const recSize = item?.recommended_size ?? null;
  // A single, supportive "why" note (fit/SKU signal) shown Amazon-style under sizes.
  const note = confidence?.drivers?.find(
    (d) => !d.positive && ["sku_return_health", "fit_signal", "size_mismatch"].includes(d.type),
  );
  const fitMatch = confidence?.drivers?.find((d) => d.positive && d.type === "fit_confidence");

  const [added, setAdded] = useState(false);
  const onAdd = () => {
    addToCart({ productId: p.id, size });
    addMut.mutate(size);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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

          {sizes && (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-sm font-medium">
                  Size: <span className="text-muted-foreground">{size}</span>
                </div>
                {/* True Fit-style "who are you shopping for?" — picks whose size to use. */}
                <FitProfileSelector axis={axis} />
              </div>

              {/* Amazon-native recommended-size line (replaces the boxed widget). */}
              {recSize && (
                <div className="mb-2 text-xs">
                  <span className="font-medium">Recommended for {confidence?.profile_name}: </span>
                  <button
                    type="button"
                    onClick={() => setSize(recSize)}
                    className="font-semibold text-primary hover:underline"
                  >
                    Size {recSize}
                  </button>
                  {item?.recommended_reason && (
                    <span className="text-muted-foreground"> · {item.recommended_reason}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const isRec = recSize === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`relative size-10 rounded-lg border text-sm transition ${
                        size === s
                          ? "border-foreground bg-secondary"
                          : isRec
                            ? "border-primary"
                            : "border-border hover:border-foreground"
                      }`}
                    >
                      {s}
                      {isRec && (
                        <span className="absolute -top-1.5 -right-1.5 size-3.5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center">
                          <ShieldCheck className="size-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* One supportive line: reassurance when it fits, a gentle nudge otherwise. */}
              {fitMatch ? (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary">
                  <ShieldCheck className="size-3.5" /> {fitMatch.label}
                </div>
              ) : note ? (
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="size-3.5 mt-px shrink-0" /> {note.label}
                </div>
              ) : null}
            </div>
          )}

          {/* Electronics: "fit-for-purpose" guidance instead of a size picker. */}
          {!isFashion && confidence && <FitForPurpose confidence={confidence} className="mt-5" />}
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
                <Link to="/amazon/cart" className="text-primary hover:underline">
                  Review cart →
                </Link>
              </span>
            </div>
          )}

          <button
            onClick={onAdd}
            className="w-full py-2.5 rounded-full text-sm font-medium cursor-pointer active:scale-[0.98] transition-all"
            style={{ background: added ? "#4CAF50" : "#FFD814", color: added ? "#fff" : "#0F1111" }}
          >
            {added ? "✓ Added to bag!" : "Add to bag"}
          </button>
          <Link
            to="/amazon/cart"
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
