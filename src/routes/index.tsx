import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  PackageCheck,
  Recycle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { categoryImage, productImage, pctFraction, DEMO_GEO } from "@/lib/demo-constants";
import { getProducts, getRescueFeed, getSecondLife } from "@/lib/relay-api";
import { GradeBadge } from "@/components/relay/GradeBadge";
import { useRelay } from "@/lib/store";
import type { Grade } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Relay - Verified second-life deals near you" },
      {
        name: "description",
        content:
          "Shop local rescue drops, certified second-life listings, and verified resale picks with Relay Condition Passports.",
      },
    ],
  }),
  component: Index,
});

const inr = (n: number) => `INR ${Math.round(n).toLocaleString("en-IN")}`;

const categoryShortcuts: {
  label: string;
  detail: string;
  image: string;
  to: "/rescue" | "/second-life" | "/genie" | "/returns";
}[] = [
  {
    label: "Local Rescue",
    detail: "Pickup deals",
    image: categoryImage("sneakers", "fashion"),
    to: "/rescue",
  },
  {
    label: "Certified",
    detail: "Ships to you",
    image: categoryImage("laptop", "electronics"),
    to: "/second-life",
  },
  {
    label: "Fashion",
    detail: "Fit checked",
    image: categoryImage("shirt", "fashion"),
    to: "/second-life",
  },
  {
    label: "Electronics",
    detail: "Tested units",
    image: categoryImage("headphones", "electronics"),
    to: "/second-life",
  },
  {
    label: "Genie",
    detail: "Wish radar",
    image: categoryImage("smartwatch", "electronics"),
    to: "/genie",
  },
  {
    label: "Returns",
    detail: "Grade or resell",
    image: categoryImage("backpack", "fashion"),
    to: "/returns",
  },
];

type HeroSlide = {
  id: string;
  kind: "rescue" | "second-life" | "catalog" | "fallback";
  targetId?: string;
  eyebrow: string;
  headline: string;
  copy: string;
  itemTitle: string;
  category: string;
  vertical: string;
  image: string;
  grade: Grade;
  originalPrice: number;
  price: number;
  cta: string;
};

function Index() {
  const persona = useRelay((s) => s.persona);
  const relayCartCount = useRelay((s) => s.relayCart.length);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeHero, setActiveHero] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const { data: nearby = [] } = useQuery({
    queryKey: ["rescue-feed", "home-local"],
    queryFn: () => getRescueFeed(DEMO_GEO, { scope: "local", fallback: [] }),
  });
  const { data: secondLife = [] } = useQuery({
    queryKey: ["second-life", "home-featured"],
    queryFn: () => getSecondLife({ fallback: [] }),
  });

  const allProducts = products ?? [];
  const featured = allProducts.slice(0, 8);
  const nearYou = nearby.slice(0, 4);
  const secondLifeFeatured = secondLife.slice(0, 4);
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const rescueSlides = nearYou.map((r) => {
      const originalPrice = r.original_price ?? 1999;
      const price = Math.round(originalPrice * (1 - pctFraction(r.current_discount_pct) / 100));
      return {
        id: `rescue-${r.id}`,
        kind: "rescue" as const,
        targetId: r.unit_id,
        eyebrow: "Live rescue drop",
        headline: "Shop returns before they leave your city.",
        copy: r.distance_km != null ? `${r.distance_km} km away - pickup available` : "Nearby pickup available",
        itemTitle: r.title ?? "Rescue listing",
        category: r.category ?? "rescue",
        vertical: r.vertical ?? "fashion",
        image: productImage(r.image_url, r.category, r.vertical),
        grade: (r.grade ?? "A") as Grade,
        originalPrice,
        price,
        cta: "View rescue",
      };
    });

    const resaleSlides = secondLifeFeatured.map((listing) => ({
      id: `second-life-${listing.id}`,
      kind: "second-life" as const,
      targetId: listing.unit_id,
      eyebrow: listing.source === "certified" ? "Certified Second-Life" : "Member resale",
      headline:
        listing.source === "certified"
          ? "Certified picks, graded and ready to ship."
          : "Member resells with a visible condition grade.",
      copy: `${listing.lister_label} - ${listing.age_days}d old - escrow protected`,
      itemTitle: listing.title,
      category: listing.category,
      vertical: listing.vertical,
      image: productImage(listing.image_url, listing.category, listing.vertical),
      grade: (listing.resale_grade as Grade) ?? "B",
      originalPrice: listing.original_price,
      price: listing.list_price,
      cta: "Shop Second Life",
    }));

    const catalogSlides = featured.slice(0, 4).map((product) => ({
      id: `catalog-${product.id}`,
      kind: "catalog" as const,
      targetId: product.id,
      eyebrow: "Popular catalog pick",
      headline: "Buy the right product first, return less later.",
      copy: "Fit checks, compatibility notes, and smarter return confidence on product pages.",
      itemTitle: product.title,
      category: product.category,
      vertical: product.vertical,
      image: productImage(product.image_url, product.category, product.vertical),
      grade: "A" as Grade,
      originalPrice: product.price,
      price: product.price,
      cta: "View product",
    }));

    const slides = [...rescueSlides, ...resaleSlides, ...catalogSlides].slice(0, 10);
    return slides.length > 0
      ? slides
      : [
          {
            id: "fallback-headphones",
            kind: "fallback",
            eyebrow: "Live second-life deal",
            headline: "Shop returns before they leave your city.",
            copy: "Verified rescue drops, certified resale, and Genie matches are now in one place.",
            itemTitle: "Verified second-life picks",
            category: "headphones",
            vertical: "electronics",
            image: categoryImage("headphones", "electronics"),
            grade: "A",
            originalPrice: 2999,
            price: 2999,
            cta: "Shop now",
          },
        ];
  }, [featured, nearYou, secondLifeFeatured]);
  const heroSlide = heroSlides[activeHero] ?? heroSlides[0];
  const heroDiscount = Math.max(
    0,
    Math.round((1 - heroSlide.price / heroSlide.originalPrice) * 100),
  );

  useEffect(() => {
    setActiveHero((current) => (current >= heroSlides.length ? 0 : current));
  }, [heroSlides.length]);

  useEffect(() => {
    if (carouselPaused || heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [carouselPaused, heroSlides.length]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ to: "/genie" });
  };

  const showNextHero = () => setActiveHero((current) => (current + 1) % heroSlides.length);
  const showPreviousHero = () =>
    setActiveHero((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  const openHeroSlide = () => {
    if (heroSlide.kind === "catalog" && heroSlide.targetId) {
      navigate({ to: "/products/$id", params: { id: heroSlide.targetId } });
      return;
    }
    if (heroSlide.kind === "rescue" && heroSlide.targetId) {
      navigate({ to: "/ledger/$unitId", params: { unitId: heroSlide.targetId } });
      return;
    }
    navigate({ to: "/second-life" });
  };

  // Seller persona's landing IS the Ops control room, not the buyer storefront.
  if (persona === "seller") return <Navigate to="/ops" replace />;

  const quickTiles = [
    {
      to: "/rescue" as const,
      icon: MapPin,
      title: "Return Rescue",
      copy: nearYou.length > 0 ? `${nearYou.length} local drops nearby` : "Local drops refresh live",
      action: "Shop nearby",
    },
    {
      to: "/second-life" as const,
      icon: BadgeCheck,
      title: "Certified Second-Life",
      copy:
        secondLifeFeatured.length > 0
          ? `${secondLifeFeatured.length} verified picks ready`
          : "AI-graded resale picks",
      action: "Browse verified",
    },
    {
      to: "/genie" as const,
      icon: Wand2,
      title: "Genie Wish Radar",
      copy: "Ask for a size, category, or budget",
      action: "Make a wish",
    },
    {
      to: "/returns" as const,
      icon: PackageCheck,
      title: "Return or Resell",
      copy: "Grade your item and choose the next path",
      action: "Start return",
    },
  ];

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-[1320px] overflow-hidden px-3 py-3 sm:px-6 sm:py-5">
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px] lg:grid-cols-[240px_minmax(0,1fr)_150px]">
            <Link
              to="/rescue"
              className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-card px-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/60 sm:col-span-2 lg:col-span-1"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="size-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Delivering near</span>
                <span className="block truncate text-sm font-semibold">Bangalore, 15 km</span>
              </span>
            </Link>

            <form onSubmit={handleSearch} className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search hoodie, headphones..."
                className="h-14 w-full rounded-lg border border-border bg-card px-12 pr-28 text-sm outline-none shadow-sm transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 sm:placeholder:text-transparent md:placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-[var(--color-relay-hover)] sm:px-4"
              >
                <Wand2 className="size-4" />
                Genie
              </button>
            </form>

            <Link
              to="/relay-cart"
              className="flex min-h-14 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold shadow-sm transition hover:border-primary/40 hover:bg-secondary/60"
            >
              <ShoppingBag className="size-5" />
              Cart
              <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">
                {relayCartCount}
              </span>
            </Link>
          </div>

          <div className="pb-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categoryShortcuts.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition hover:border-primary/40 hover:bg-secondary/60"
                >
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary sm:size-14">
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onFocus={() => setCarouselPaused(true)}
            onBlur={() => setCarouselPaused(false)}
            className="relative min-h-[430px] overflow-hidden rounded-lg border border-border bg-ink text-white shadow-sm sm:min-h-[340px]"
          >
            <motion.img
              key={heroSlide.id}
              src={heroSlide.image}
              alt={heroSlide.itemTitle}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 0.7, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-60 sm:opacity-70 md:w-[62%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,32,27,0.98)_0%,rgba(20,32,27,0.82)_48%,rgba(20,32,27,0.6)_100%)] sm:bg-[linear-gradient(90deg,rgba(20,32,27,0.96)_0%,rgba(20,32,27,0.82)_42%,rgba(20,32,27,0.2)_100%)]" />
            {heroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPreviousHero}
                  aria-label="Show previous featured product"
                  className="absolute left-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white/20 md:flex"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={showNextHero}
                  aria-label="Show next featured product"
                  className="absolute right-3 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur transition hover:bg-white/20 md:flex"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <div className="relative flex min-h-[430px] max-w-xl flex-col justify-between p-4 sm:min-h-[340px] sm:p-7">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                  <Zap className="size-3.5 text-[var(--color-signal)]" />
                  {heroSlide.eyebrow}
                </div>
                <motion.h1
                  key={`${heroSlide.id}-headline`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32 }}
                  className="mt-4 max-w-[14ch] font-display text-3xl font-semibold leading-[0.98] sm:mt-5 sm:text-5xl"
                >
                  {heroSlide.headline}
                </motion.h1>
                <p className="mt-3 max-w-md text-sm leading-5 text-white/78 sm:mt-4 sm:text-base sm:leading-6">
                  {heroSlide.copy}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="rounded-lg border border-white/15 bg-white/12 p-3 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <GradeBadge grade={heroSlide.grade} size="sm" />
                    <span className="text-xs text-white/72">{heroSlide.category}</span>
                  </div>
                  <div className="mt-2 truncate text-sm font-semibold">{heroSlide.itemTitle}</div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-display text-xl sm:text-2xl">{inr(heroSlide.price)}</span>
                    <span className="text-xs text-white/55 line-through">
                      {inr(heroSlide.originalPrice)}
                    </span>
                    {heroDiscount > 0 && (
                      <span className="rounded bg-[var(--color-signal)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--color-signal-foreground)]">
                        {heroDiscount}% off
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openHeroSlide}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  {heroSlide.cta} <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
            {heroSlides.length > 1 && (
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 sm:right-5">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveHero(index)}
                    aria-label={`Show featured product ${index + 1}`}
                    aria-current={index === activeHero ? "true" : undefined}
                    className={`h-2 rounded-full transition-all ${
                      index === activeHero ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              to="/genie"
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:bg-secondary/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-medium uppercase text-muted-foreground">
                    Best experience
                  </div>
                  <div className="mt-2 font-display text-2xl font-semibold leading-tight">
                    Tell Relay what to watch.
                  </div>
                </div>
                <Bell className="size-5 text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Genie keeps an eye on local returns and certified listings for your size and budget.
              </p>
              <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
                Add wish <ArrowRight className="size-4" />
              </span>
            </Link>

            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-primary" />
                Why shoppers trust it
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-secondary p-3">
                  <Camera className="mx-auto size-4 text-primary" />
                  <div className="mt-2 text-xs font-medium">Real photos</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <BadgeCheck className="mx-auto size-4 text-primary" />
                  <div className="mt-2 text-xs font-medium">Grade shown</div>
                </div>
                <div className="rounded-lg bg-secondary p-3">
                  <Recycle className="mx-auto size-4 text-primary" />
                  <div className="mt-2 text-xs font-medium">CO2 saved</div>
                </div>
              </div>
              <Link
                to="/impact"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                View wallet <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 md:grid-cols-4">
          {quickTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.title}
                to={tile.to}
                className="group rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/40 hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="mt-3 font-semibold">{tile.title}</div>
                <div className="mt-1 min-h-10 text-sm text-muted-foreground">{tile.copy}</div>
                <div className="mt-3 text-xs font-semibold text-primary">{tile.action}</div>
              </Link>
            );
          })}
        </section>

        {nearYou.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Clock3 className="size-3.5" /> Just dropped nearby
                </div>
                <h2 className="mt-1 font-display text-2xl font-semibold">Pickup deals in sight</h2>
              </div>
              <Link
                to="/rescue"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                See all <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {nearYou.map((r, i) => {
                const orig = r.original_price ?? 1999;
                const curPct = pctFraction(r.current_discount_pct);
                const price = Math.round(orig * (1 - curPct / 100));
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to="/ledger/$unitId"
                      params={{ unitId: r.unit_id }}
                      className="group block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-primary/40"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={productImage(r.image_url, r.category, r.vertical)}
                          alt={r.title ?? ""}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute left-2 top-2">
                          <GradeBadge grade={(r.grade ?? "A") as Grade} size="sm" />
                        </div>
                        <div className="absolute bottom-2 left-2 rounded bg-card/90 px-2 py-1 text-[11px] font-medium">
                          {r.distance_km != null ? `${r.distance_km} km` : "nearby"}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-semibold">{r.title ?? "Rescue listing"}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{inr(price)}</span>
                          <span className="text-xs text-muted-foreground line-through">
                            {inr(orig)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {secondLifeFeatured.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                  <Recycle className="size-3.5 text-primary" /> Second Life
                </div>
                <h2 className="mt-1 font-display text-2xl font-semibold">Verified resale picks</h2>
              </div>
              <Link
                to="/second-life"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Browse <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {secondLifeFeatured.map((listing, i) => {
                const certified = listing.source === "certified";
                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to="/second-life"
                      className="group block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-primary/40"
                      aria-label={`View ${listing.title} on Second Life`}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={productImage(listing.image_url, listing.category, listing.vertical)}
                          alt={listing.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute left-2 top-2">
                          <GradeBadge grade={(listing.resale_grade as Grade) ?? "B"} size="sm" />
                        </div>
                        <div className="absolute bottom-2 left-2 rounded bg-card/90 px-2 py-1 text-[11px] font-medium">
                          {certified ? "Certified" : "Member"}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-semibold">{listing.title}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{inr(listing.list_price)}</span>
                          <span className="text-xs text-muted-foreground line-through">
                            {inr(listing.original_price)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 pb-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                <Heart className="size-3.5" /> More to browse
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold">Popular catalog picks</h2>
            </div>
            <Link
              to="/rescue"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              Rescue feed <ArrowRight className="size-4" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    to="/products/$id"
                    params={{ id: p.id }}
                    className="group block overflow-hidden rounded-lg border border-border bg-card shadow-sm transition hover:border-primary/40"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                      <img
                        src={productImage(p.image_url, p.category, p.vertical)}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute left-2 top-2 rounded bg-card/90 px-2 py-1 text-[11px] font-medium">
                        {(p.metadata as { brand?: string })?.brand ?? p.vertical}
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      <div className="mt-1 text-sm font-semibold">{inr(p.price)}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Product data is not loaded yet. Rescue, Genie, and category shortcuts stay available.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
