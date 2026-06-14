import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ImpactWallet } from "./ImpactWallet";
import { useRelay, type Persona } from "@/lib/store";
import { demoReset } from "@/lib/relay-api";

const consumerLinks = [
  { to: "/", label: "Discover" },
  { to: "/rescue", label: "Rescue" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/returns/new", label: "Return" },
  { to: "/cart", label: "Cart" },
];

const sellerLinks = [{ to: "/ops", label: "Ops" }];

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme, persona, setPersona } = useRelay();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const links = persona === "seller" ? [...consumerLinks, ...sellerLinks] : consumerLinks;

  const onReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await demoReset();
      await qc.invalidateQueries();
    } catch (e) {
      console.error(e);
      alert("Demo reset failed — is relay-api running on VITE_API_URL?");
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/75 border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="size-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-display font-semibold">R</div>
          <span className="font-display text-lg tracking-tight">Relay</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Persona toggle — switches X-User-Id for demo flows */}
          <div className="hidden sm:flex items-center rounded-full border border-border p-0.5 text-[11px]">
            {(["seller", "buyer"] as Persona[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setPersona(p);
                  qc.invalidateQueries();
                }}
                className={`px-2.5 py-1 rounded-full capitalize transition ${persona === p ? "bg-secondary text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {p}
              </button>
            ))}
          </div>

          <ImpactWallet />

          {/* Hidden-in-plain-sight demo reset (dev / rehearsal) */}
          <button
            type="button"
            title="Reset demo data"
            onClick={onReset}
            disabled={resetting}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
          >
            <RotateCcw className={`size-4 ${resetting ? "animate-spin" : ""}`} />
          </button>

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
