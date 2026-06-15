import { Link, useRouterState } from "@tanstack/react-router";
import {
  Moon,
  Search,
  ShoppingBag,
  Sun,
  Package,
  Leaf,
  Shirt,
  Tv,
  Film,
  Sparkles,
} from "lucide-react";
import { SmileLogo } from "./SmileLogo";
import { useRelay } from "@/lib/store";
import { PersonaToggle } from "./PersonaToggle";
import { useSmileNavigate } from "./SmileTransition";

const tiles = [
  { label: "Fresh", icon: Leaf, color: "#3DA45E" },
  { label: "Fashion", icon: Shirt, color: "#7C3AED" },
  { label: "Devices", icon: Tv, color: "#2B6CB0" },
  { label: "Prime Video", icon: Film, color: "#1A8FE3" },
  { label: "miniTV", icon: Sparkles, color: "#E25555" },
];

export function AmazonNav() {
  const { theme, toggleTheme, cart, persona } = useRelay();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const trigger = useSmileNavigate();
  const goSeller = persona === "seller";

  return (
    <header className="sticky top-0 z-40">
      {/* top bar */}
      <div className="bg-[#131A22] text-white">
        <div className="mx-auto max-w-[1320px] px-4 h-14 flex items-center gap-4">
          <Link
            to={goSeller ? "/amazon/seller" : "/amazon"}
            className="flex flex-col leading-tight"
          >
            <span className="font-display text-lg tracking-tight">amazon</span>
            <SmileLogo size={56} color="#FF9900" />
          </Link>
          <div className="hidden md:flex flex-1 max-w-2xl items-stretch rounded-md overflow-hidden">
            <select
              aria-label="Search department"
              className="bg-[#F3F3F3] text-[#131A22] text-xs px-2 outline-none border-r border-[#dadada]"
            >
              <option>All</option>
              <option>Fashion</option>
              <option>Electronics</option>
            </select>
            <input
              aria-label="Search Amazon"
              placeholder="Search Amazon"
              className="flex-1 px-3 py-2 text-sm text-[#131A22] bg-white outline-none"
            />
            <button
              aria-label="Search"
              className="bg-[#FF9900] hover:bg-[#e88e00] transition px-3 flex items-center"
            >
              <Search className="size-4 text-[#131A22]" />
            </button>
          </div>
          <Link
            to="/amazon/orders"
            className="hidden sm:flex flex-col text-[11px] leading-tight hover:outline hover:outline-1 hover:outline-white/40 rounded px-1.5 py-0.5"
          >
            <span className="opacity-80">Returns</span>
            <span className="text-sm font-medium">&amp; Orders</span>
          </Link>
          <Link
            to="/cart"
            className="relative flex items-center gap-1 px-2 py-1 hover:outline hover:outline-1 hover:outline-white/40 rounded"
          >
            <ShoppingBag className="size-5" />
            <span className="text-sm">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#FF9900] text-[#131A22] text-[10px] font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Link>
        </div>

        {/* category tile strip */}
        <div className="bg-[#232F3E] border-t border-white/5">
          <div className="mx-auto max-w-[1320px] px-4 h-11 flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => trigger(goSeller ? "/ops" : "/")}
              className="group relative inline-flex items-center gap-2 px-3 h-9 rounded-md hover:bg-white/10 transition shrink-0"
              aria-label="Open Relay second-life"
              title="Open Relay second-life"
            >
              <span className="inline-flex items-center justify-center size-6 rounded bg-white/10">
                <SmileLogo size={20} color="#2DD391" />
              </span>
              <span className="text-sm font-medium">Relay</span>
              <span className="text-[9px] uppercase tracking-wider bg-[#2DD391] text-[#0E1311] rounded-full px-1.5 py-px ml-0.5">
                second life
              </span>
            </button>
            <div className="h-5 w-px bg-white/15 mx-1" />
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.label}
                  aria-label={t.label}
                  className="inline-flex items-center gap-2 px-3 h-9 rounded-md hover:bg-white/10 transition shrink-0 text-sm text-white/90"
                >
                  <Icon className="size-4" style={{ color: t.color }} /> {t.label}
                </button>
              );
            })}
            <Link
              to="/amazon/orders"
              className={`inline-flex items-center gap-2 px-3 h-9 rounded-md hover:bg-white/10 transition shrink-0 text-sm ${pathname.endsWith("/orders") ? "text-white" : "text-white/80"}`}
            >
              <Package className="size-4" /> Your Orders
            </Link>
          </div>
        </div>
      </div>

      {/* sub-bar with persona + theme */}
      <div className="bg-background/85 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1320px] px-4 h-10 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Amazon umbrella · Layer 1 · selling new
          </div>
          <div className="flex items-center gap-2">
            <PersonaToggle />
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="size-8 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
            >
              {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
