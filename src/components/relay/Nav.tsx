import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { ImpactWallet } from "./ImpactWallet";
import { SmileLogo } from "./SmileLogo";
import { useRelay } from "@/lib/store";

const buyerLinks = [
  { to: "/", label: "Discover" },
  { to: "/rescue", label: "Rescue" },
  { to: "/second-life", label: "Second Life" },
  { to: "/genie", label: "Genie" },
  { to: "/returns", label: "Return" },
  { to: "/relay-cart", label: "Cart" },
];

// Seller persona has exactly two destinations: Ops (the seller landing) and the
// returned-unit tracking / relist console.
const sellerLinks = [
  { to: "/ops", label: "Ops" },
  { to: "/seller/orders", label: "Returned units" },
];

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme, persona } = useRelay();
  const relayCartCount = useRelay((s) => s.relayCart.length);

  const isSeller = persona === "seller";
  const links = isSeller ? sellerLinks : buyerLinks;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-[1320px] px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={persona === "seller" ? "/ops" : "/"}
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="size-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <SmileLogo size={18} color="currentColor" />
            </div>
            <span className="font-display text-lg tracking-tight">Relay</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground border border-border rounded-full px-1.5 py-0.5 ml-1 hidden sm:inline-block">
              {persona === "seller" ? "Ops · control room" : "second-life"}
            </span>
          </Link>
          <Link
            to="/amazon"
            className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded-full px-2 py-1 ml-1"
          >
            <ArrowLeft className="size-3" /> Amazon
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            const showCount = l.to === "/relay-cart" && relayCartCount > 0;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-3 py-1.5 text-sm rounded-full transition-colors ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
                {showCount && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tabular align-middle">
                    {relayCartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Buyer-only: the second-life footprint / green-credit wallet. Sellers
              live in the Ops console and have no consumer wallet. Persona is
              switched from the single global toggle on the Amazon storefront. */}
          {!isSeller && <ImpactWallet />}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
