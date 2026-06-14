import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { categoryImage } from "@/lib/demo-constants";
import { getProduct } from "@/lib/relay-api";

export const Route = createFileRoute("/products/$id")({
  component: PDP,
});

function PDP() {
  const { id } = useParams({ from: "/products/$id" });
  const { data: p, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProduct(id),
  });

  if (isLoading) return <div className="p-12 max-w-[1200px] mx-auto text-muted-foreground">Loading…</div>;
  if (!p) return <div className="p-12 max-w-[1200px] mx-auto">Product not found.</div>;

  const brand = (p.metadata as { brand?: string })?.brand ?? p.vertical;
  const fitFlags = p.fit_flags?.flags ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to Discover</Link>
      <div className="grid lg:grid-cols-2 gap-10 mt-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl overflow-hidden bg-secondary aspect-[4/5]">
            <img src={categoryImage(p.category, p.vertical)} alt={p.title} className="w-full h-full object-cover" />
          </div>
        </motion.div>
        <div>
          <div className="text-xs text-muted-foreground">{brand} · {p.sku}</div>
          <h1 className="font-display text-3xl mt-1">{p.title}</h1>
          <div className="text-3xl font-display tabular mt-4">₹{p.price.toLocaleString("en-IN")}</div>
          <p className="text-sm text-muted-foreground mt-4">{p.category} · {p.vertical}</p>

          {fitFlags.length > 0 && (
            <div className="mt-6 card-soft p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Fit intelligence</div>
              {fitFlags.map((f, i) => (
                <div key={i} className="text-sm flex gap-2 items-start mt-1">
                  <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
                  {f.message ?? f.type.replace(/_/g, " ")}
                </div>
              ))}
            </div>
          )}

          <Link to="/returns/new" className="mt-8 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium">
            Start a return <ArrowRight className="size-4" />
          </Link>
          <Link to="/cart" className="ml-3 inline-flex items-center gap-2 border border-border px-5 py-3 rounded-xl text-sm">
            View cart
          </Link>
        </div>
      </div>
    </div>
  );
}
