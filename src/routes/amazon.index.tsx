import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ShieldCheck, Star } from "lucide-react";
import { productImage } from "@/lib/demo-constants";
import { getProducts } from "@/lib/relay-api";
import { useSmileNavigate } from "@/components/relay/SmileTransition";
import { SmileLogo } from "@/components/relay/SmileLogo";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/amazon/")({
  head: () => ({
    meta: [
      { title: "Amazon.in: Online Shopping India" },
      { name: "description", content: "Amazon storefront with Relay second-life built in." },
    ],
  }),
  component: AmazonHome,
});

function AmazonHome() {
  const trigger = useSmileNavigate();
  const persona = useRelay((s) => s.persona);
  const { data: products = [], isPending } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const ordered = [...products].sort(
    (a, b) => Number(b.sku === "FAS-SN-699") - Number(a.sku === "FAS-SN-699"),
  );
  const hero = ordered[0];
  const categoryCards = [
    ordered.find((product) => product.sku === "FAS-SN-699"),
    ordered.find((product) => product.sku === "FAS-TS-001"),
    ordered.find((product) => product.sku === "ELE-HP-001"),
    ordered.find((product) => product.sku === "ELE-SW-001"),
  ].filter((product): product is (typeof ordered)[number] => Boolean(product));
  const recommended = ordered.slice(0, 10);

  if (persona === "seller") return <Navigate to="/amazon/seller" replace />;

  return (
    <div className="min-h-full bg-[#e3e6e6] pb-10 text-[#0f1111]">
      <div className="mx-auto max-w-[1500px]">
        <section
          className="relative h-[330px] overflow-hidden bg-[#dce8ef] sm:h-[390px]"
          style={
            hero
              ? {
                  backgroundImage: `url(${productImage(hero.image_url, hero.category, hero.vertical)})`,
                  backgroundPosition: "center right",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          <div className="absolute inset-y-0 left-0 w-full bg-[rgba(239,246,249,.92)] sm:w-[58%]" />
          <div className="relative max-w-[620px] px-6 pt-14 sm:px-12 sm:pt-20">
            <div className="text-sm font-semibold text-[#565959]">AMAZON FASHION</div>
            <h1 className="mt-2 max-w-lg text-3xl font-bold leading-tight sm:text-5xl">
              Everyday shoes, everyday prices
            </h1>
            <p className="mt-3 max-w-md text-base text-[#3b4145]">
              Step into comfort with new-season footwear, easy returns, and doorstep delivery.
            </p>
            {hero && (
              <Link
                to="/amazon/products/$id"
                params={{ id: hero.id }}
                className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#ffd814] px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-[#f7ca00]"
              >
                Shop now <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </section>

        <div className="relative z-10 -mt-4 grid grid-cols-1 gap-5 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((p, index) => (
            <section key={p.id} className="bg-white p-5 shadow-sm">
              <h2 className="min-h-14 text-xl font-bold leading-tight">
                {index === 0
                  ? "Great prices on shoes"
                  : index === 1
                    ? "Refresh your wardrobe"
                    : index === 2
                      ? "Headphones for every moment"
                      : "Smart watches and wearables"}
              </h2>
              <Link to="/amazon/products/$id" params={{ id: p.id }} className="mt-2 block">
                <div className="aspect-square overflow-hidden bg-[#f7f7f7]">
                  <img
                    src={productImage(p.image_url, p.category, p.vertical)}
                    alt={p.title}
                    className="h-full w-full object-contain p-2"
                  />
                </div>
                <div className="mt-4 text-[13px] text-[#007185] hover:text-[#c7511f] hover:underline">
                  See more
                </div>
              </Link>
            </section>
          ))}
        </div>

        <section className="mx-4 mt-5 bg-white px-5 py-6 shadow-sm">
          <div className="mb-4 flex items-baseline gap-3">
            <h2 className="text-xl font-bold sm:text-2xl">Inspired by your shopping trends</h2>
            <span className="hidden text-sm text-[#007185] sm:inline">See more</span>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2">
            {recommended.map((p) => (
              <Link
                key={p.id}
                to="/amazon/products/$id"
                params={{ id: p.id }}
                className="w-[180px] shrink-0 sm:w-[210px]"
              >
                <div className="aspect-square bg-[#f7f7f7]">
                  <img
                    src={productImage(p.image_url, p.category, p.vertical)}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-contain p-3"
                  />
                </div>
                <div className="mt-2 line-clamp-2 text-sm leading-snug hover:text-[#c7511f]">
                  {p.title}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-[#007185]">
                  <span className="text-[#de7921]">4.4</span>
                  <Star className="size-3 fill-[#de7921] text-[#de7921]" /> 1,284
                </div>
                <div className="mt-1 text-lg">
                  <sup className="text-xs">₹</sup>
                  {p.price.toLocaleString("en-IN")}
                </div>
                <div className="text-xs">FREE delivery tomorrow</div>
              </Link>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={() => trigger("/")}
          className="mx-4 mt-5 flex w-[calc(100%-2rem)] items-center gap-5 bg-white p-5 text-left shadow-sm hover:outline hover:outline-2 hover:outline-[#2a7f62]"
        >
          <div className="flex size-14 shrink-0 items-center justify-center bg-[#e7f4ef]">
            <SmileLogo size={46} color="#0f6b4f" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase text-[#0f6b4f]">Inside Amazon</div>
            <div className="text-xl font-bold">Shop returned products with a verified history</div>
            <div className="mt-1 text-sm text-[#565959]">
              Relay gives every returned product a Condition Passport before it finds its next
              owner.
            </div>
          </div>
          <ShieldCheck className="hidden size-8 text-[#0f6b4f] sm:block" />
        </button>

        {isPending && (
          <p className="py-16 text-center text-sm text-[#565959]">Loading today's deals...</p>
        )}
        {!isPending && products.length === 0 && (
          <p className="py-16 text-center text-sm text-[#565959]">
            No products are available right now.
          </p>
        )}
      </div>
    </div>
  );
}
