import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getWishMatches } from "@/lib/relay-api";
import { useRelay } from "@/lib/store";

export function GenieMatchNotifier() {
  const userId = useRelay((state) => state.userId);
  const seen = useRef<Set<string> | null>(null);
  const storageKey = `relay-genie-seen-${userId}`;
  const { data: matches = [] } = useQuery({
    queryKey: ["wish-matches", userId],
    queryFn: () => getWishMatches([]),
    refetchInterval: 3_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (seen.current === null) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
        seen.current = new Set(saved);
      } catch {
        seen.current = new Set();
      }
    }

    const current = matches.map((match) => `${match.wish_id}:${match.unit_id}`);
    const fresh = matches.filter(
      (match) => !seen.current?.has(`${match.wish_id}:${match.unit_id}`),
    );
    current.forEach((key) => seen.current?.add(key));
    localStorage.setItem(storageKey, JSON.stringify([...seen.current]));

    const first = fresh[0];
    if (!first) return;
    const price = first.list_price ?? first.price;
    toast.success("Genie found your match", {
      description: `${first.title ?? "A returned item"}${price != null ? ` is available for ₹${price.toLocaleString("en-IN")}` : " is available now"}.`,
      duration: 10_000,
      action: {
        label: "View match",
        onClick: () => window.location.assign("/genie"),
      },
    });
  }, [matches, storageKey]);

  return null;
}
