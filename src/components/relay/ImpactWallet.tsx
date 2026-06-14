import { Leaf, Sparkles, ArrowRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedCounter } from "./AnimatedCounter";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";
import { getImpact, type ImpactWalletDTO } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

const FALLBACK: ImpactWalletDTO = {
  user_id: "demo", total_co2_saved_kg: 47.2, credits_balance: 1280, locked_credits: 184,
  lifetime_credits: 1464, early_access: true, early_access_threshold: 100, events: [],
};

export function ImpactWallet() {
  const userId = useRelay((s) => s.userId);
  const { data: wallet } = useQuery({
    queryKey: ["impact", userId],
    queryFn: () => getImpact(FALLBACK),
    initialData: FALLBACK,
  });
  const co2Kg = wallet.total_co2_saved_kg;
  const credits = wallet.credits_balance;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:shadow-sm transition-shadow">
          <span className="flex items-center gap-1.5">
            <Leaf className="size-3.5 text-primary" />
            <span className="tabular font-medium"><AnimatedCounter value={co2Kg} decimals={1} /> kg</span>
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5" style={{ color: "var(--color-signal)" }} />
            <span className="tabular font-medium"><AnimatedCounter value={credits} /></span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-5">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Impact Wallet</div>
            <h4 className="text-lg font-medium mt-1">Your second-life footprint</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-xs text-muted-foreground">CO₂ saved</div>
              <div className="text-2xl font-display tabular mt-1"><AnimatedCounter value={co2Kg} decimals={1} /> <span className="text-sm text-muted-foreground">kg</span></div>
            </div>
            <div className="rounded-xl bg-secondary p-3">
              <div className="text-xs text-muted-foreground">Green credits</div>
              <div className="text-2xl font-display tabular mt-1" style={{ color: "var(--color-signal)" }}><AnimatedCounter value={credits} /></div>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "color-mix(in oklab, var(--color-signal) 12%, transparent)" }}>
            <Zap className="size-3.5 mt-0.5 shrink-0" style={{ color: "var(--color-signal)" }} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {wallet.early_access
                ? "Early access unlocked — you see new rescue listings 10 min before everyone else."
                : `Earn ${Math.max(0, (wallet.early_access_threshold || 100) - wallet.lifetime_credits).toFixed(0)} more credits to unlock early access to the rescue feed.`}
            </p>
          </div>
          <Link to="/impact" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:gap-2 transition-all">
            Open Impact Wallet <ArrowRight className="size-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}