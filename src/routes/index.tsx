import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { categoryImage } from "@/lib/demo-constants";
import { getProducts } from "@/lib/relay-api";
import { GradeBadge } from "@/components/relay/GradeBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relay — Every product deserves a second life" },
      { name: "description", content: "AI-graded Condition Passports route returned items to their best next owner." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const featured = products ?? [];

  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="pt-20 pb-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Live catalog · {featured.length} SKUs seeded
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.02] tracking-tight mt-6"
          >
            Every product<br />deserves a <em className="not-italic" style={{ color: "var(--color-relay)" }}>second life</em>.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed">
            Relay grades every returned item into a verifiable <strong className="text-foreground font-medium">Condition Passport</strong>, then routes it to its best next owner — not the landfill.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/rescue" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-medium hover:bg-[var(--color-relay-hover)] transition-colors shadow-sm active:scale-[0.98]">
              Rescue something nearby <ArrowRight className="size-4" />
            </Link>
            <Link to="/returns/new" className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 rounded-xl text-sm font-medium hover:bg-secondary transition-colors">
              Start a return
            </Link>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 18 }}
          className="card-soft p-6 relative">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Condition Passport</div>
          <div className="font-display text-2xl mt-2">Grade A · verified</div>
          <div className="text-sm text-muted-foreground mt-2">2.4 kg CO₂ saved vs warehouse return cycle</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-primary">
            <ShieldCheck className="size-4" /> Anchored on LifeLedger
          </div>
        </motion.div>
      </section>

      <section className="pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Catalog</div>
            <h2 className="font-display text-3xl mt-2">Second-life ready</h2>
          </div>
          <Link to="/rescue" className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            Rescue feed <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to="/products/$id" params={{ id: p.id }} className="card-soft overflow-hidden block group">
                <div className="aspect-[4/5] bg-secondary overflow-hidden relative">
                  <img src={categoryImage(p.category, p.vertical)} alt={p.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute top-3 left-3"><GradeBadge grade="A" size="sm" /></div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">{(p.metadata as { brand?: string })?.brand ?? p.vertical}</div>
                  <div className="text-sm font-medium mt-0.5">{p.title}</div>
                  <div className="text-sm tabular mt-2">₹{p.price.toLocaleString("en-IN")}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        {featured.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No products loaded — run demo reset (↻ in nav) with relay-api on port 8010.
          </p>
        )}
      </section>
    </div>
  );
}
