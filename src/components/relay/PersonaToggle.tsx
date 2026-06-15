import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Briefcase, User } from "lucide-react";
import { useRelay, type Persona } from "@/lib/store";

export function PersonaToggle() {
  const { persona, setPersona } = useRelay();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inAmazon = pathname.startsWith("/amazon");

  const onSwitch = (p: Persona) => {
    if (p === persona) return;
    // setPersona also swaps X-User-Id; invalidate so persona-scoped queries refetch.
    setPersona(p);
    qc.invalidateQueries();
    if (p === "seller") {
      navigate({ to: inAmazon ? "/amazon/seller" : "/ops" });
    } else {
      navigate({ to: inAmazon ? "/amazon" : "/" });
    }
  };

  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 text-xs">
      <button
        onClick={() => onSwitch("buyer")}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${persona === "buyer" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={persona === "buyer"}
      >
        <User className="size-3" /> Buyer
      </button>
      <button
        onClick={() => onSwitch("seller")}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${persona === "seller" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={persona === "seller"}
      >
        <Briefcase className="size-3" /> Seller
      </button>
    </div>
  );
}
