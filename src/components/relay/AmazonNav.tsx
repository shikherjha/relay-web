import { Link, useRouterState } from "@tanstack/react-router";
import { MapPin, Menu, Moon, Search, ShoppingCart, Sun } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SmileLogo } from "./SmileLogo";
import { useRelay } from "@/lib/store";
import { PersonaToggle } from "./PersonaToggle";
import { useSmileNavigate } from "./SmileTransition";
import { getCart } from "@/lib/relay-api";

const departments = [
  "Amazon miniTV",
  "Sell",
  "Best Sellers",
  "Mobiles",
  "Today's Deals",
  "Customer Service",
  "Fashion",
  "Electronics",
];

export function AmazonNav() {
  const { theme, toggleTheme, persona } = useRelay();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const trigger = useSmileNavigate();
  const { data: serverCart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart({ user_id: "", items: [], bracketing: [] }),
    staleTime: 10_000,
  });
  const cartCount = serverCart?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0;
  const goSeller = persona === "seller";

  return (
    <header className="sticky top-0 z-40 text-white shadow-sm">
      <div className="bg-[#131921]">
        <div className="mx-auto flex h-auto max-w-[1500px] flex-wrap items-center gap-2 px-2 py-2 sm:h-[60px] sm:flex-nowrap sm:px-4 sm:py-0">
          <Link
            to={goSeller ? "/amazon/seller" : "/amazon"}
            className="flex h-12 min-w-[104px] items-center px-2 hover:outline hover:outline-1 hover:outline-white sm:min-w-[116px]"
            aria-label="Amazon India home"
          >
            <span className="relative pt-1 text-[22px] font-semibold leading-none tracking-normal">
              amazon<span className="ml-0.5 align-top text-[12px] font-normal">.in</span>
              <span className="absolute left-4 top-[24px]">
                <SmileLogo size={58} color="#FF9900" />
              </span>
            </span>
          </Link>

          <button className="hidden h-12 min-w-[145px] items-center gap-1 px-2 text-left hover:outline hover:outline-1 hover:outline-white lg:flex">
            <MapPin className="mt-2 size-5 shrink-0" />
            <span className="leading-tight">
              <span className="block text-[11px] text-white/70">
                Delivering to Bengaluru 560001
              </span>
              <span className="block text-sm font-bold">Update location</span>
            </span>
          </button>

          <div className="order-3 flex h-10 w-full min-w-0 flex-none overflow-hidden rounded-md focus-within:ring-2 focus-within:ring-[#ff9900] sm:order-none sm:w-auto sm:flex-1">
            <select
              aria-label="Search department"
              className="hidden border-r border-[#cdcdcd] bg-[#e6e6e6] px-2 text-xs text-[#333] outline-none sm:block"
            >
              <option>All</option>
              <option>Fashion</option>
              <option>Electronics</option>
              <option>Relay Second-Life</option>
            </select>
            <input
              aria-label="Search Amazon.in"
              placeholder="Search Amazon.in"
              className="min-w-0 flex-1 bg-white px-3 text-sm text-[#0f1111] outline-none"
            />
            <button
              aria-label="Search"
              className="flex w-12 items-center justify-center bg-[#febd69] hover:bg-[#f3a847]"
            >
              <Search className="size-5 text-[#131921]" />
            </button>
          </div>

          <div className="hidden h-12 items-center px-2 text-sm font-bold hover:outline hover:outline-1 hover:outline-white xl:flex">
            EN
          </div>
          <div className="hidden h-12 min-w-[125px] items-center px-2 leading-tight hover:outline hover:outline-1 hover:outline-white md:flex">
            <span>
              <span className="block text-[11px]">Hello, Priya</span>
              <span className="block text-sm font-bold">Account &amp; Lists</span>
            </span>
          </div>
          <Link
            to="/amazon/orders"
            className="hidden h-12 min-w-[80px] items-center px-2 leading-tight hover:outline hover:outline-1 hover:outline-white sm:flex"
          >
            <span>
              <span className="block text-[11px]">Returns</span>
              <span className="block text-sm font-bold">&amp; Orders</span>
            </span>
          </Link>
          <Link
            to="/amazon/cart"
            className="relative flex h-12 items-end gap-1 px-2 pb-2 hover:outline hover:outline-1 hover:outline-white"
          >
            <ShoppingCart className="size-8" />
            <span className="hidden text-sm font-bold sm:inline">Cart</span>
            <span className="absolute left-[27px] top-0 text-base font-bold text-[#f08804]">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>

      <div className="bg-[#232f3e]">
        <div className="mx-auto flex h-10 max-w-[1500px] items-center gap-1 overflow-x-auto px-2 text-sm">
          <button className="inline-flex h-9 shrink-0 items-center gap-1 px-2 font-bold hover:outline hover:outline-1 hover:outline-white">
            <Menu className="size-5" /> All
          </button>
          {departments.map((label) => (
            <button
              key={label}
              className="h-9 shrink-0 px-2 hover:outline hover:outline-1 hover:outline-white"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => trigger(goSeller ? "/ops" : "/")}
            className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 px-2 font-semibold hover:outline hover:outline-1 hover:outline-white"
          >
            <SmileLogo size={24} color="#2dd391" /> Relay Second-Life
          </button>
          <div className="flex shrink-0 items-center gap-1 border-l border-white/20 pl-2">
            <PersonaToggle />
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="flex size-8 items-center justify-center hover:outline hover:outline-1 hover:outline-white"
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {pathname === "/amazon" || pathname === "/amazon/" ? null : (
        <div className="bg-white px-4 py-1.5 text-center text-xs text-[#0f1111]">
          Free delivery on eligible orders. Easy returns powered by Relay.
        </div>
      )}
    </header>
  );
}
