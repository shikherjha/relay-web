import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryImage, DEMO_GEO } from "@/lib/demo-constants";
import {
  checkout,
  deleteCartItem,
  getCart,
  getCartReturnConfidence,
  getFitProfiles,
  getProducts,
  patchCartItem,
} from "@/lib/relay-api";
import type { ProductConfidenceDTO } from "@/lib/relay-api";
import { CartLineNudge } from "@/components/relay/CartLineNudge";
import { CartRecipientChip } from "@/components/relay/CartRecipientChip";
import { useRelay } from "@/lib/store";

export const Route = createFileRoute("/amazon/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Amazon" },
      { name: "description", content: "Your Amazon bag with the bracketing interceptor." },
    ],
  }),
  component: AmazonCartPage,
});

function AmazonCartPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { userId } = useRelay();
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => getCart({ user_id: "", items: [], bracketing: [] }),
  });
  // Per-line recipients now drive scoring (no cart-wide profile param).
  const { data: confidence } = useQuery({
    queryKey: ["cart-confidence"],
    queryFn: () => getCartReturnConfidence(),
  });
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts([]),
  });
  const { data: profilesState } = useQuery({
    queryKey: ["fit-profiles", userId],
    queryFn: () => getFitProfiles({ active_profile: "self", profiles: [] }),
  });
  const profiles = profilesState?.profiles ?? [];

  const invalidateCart = async () => {
    await qc.invalidateQueries({ queryKey: ["cart"] });
    await qc.invalidateQueries({ queryKey: ["cart-confidence"] });
  };

  const checkoutMut = useMutation({
    // Empty body checks out the server cart; clears it and records an order.
    mutationFn: () => checkout({ geo: DEMO_GEO, clear_cart: true }),
    onSuccess: async () => {
      await invalidateCart();
      await qc.invalidateQueries({ queryKey: ["orders"] });
      navigate({ to: "/amazon/orders" });
    },
  });

  const removeMut = useMutation({
    mutationFn: (itemId: string) => deleteCartItem(itemId),
    onSuccess: invalidateCart,
  });

  const items = cart?.items ?? [];

  // Drop the spare sizes of a same-recipient duplicate, keeping `keepSize`.
  const keepSizeMut = useMutation({
    mutationFn: async ({ keepSize, lineIds }: { keepSize: string; lineIds: string[] }) => {
      const drop = items.filter((c) => lineIds.includes(c.id) && c.size !== keepSize);
      await Promise.all(drop.map((c) => deleteCartItem(c.id)));
    },
    onSuccess: invalidateCart,
  });

  // Swap a line's size (the recipient's recommended size).
  const swapSizeMut = useMutation({
    mutationFn: ({ itemId, size }: { itemId: string; size: string }) =>
      patchCartItem(itemId, { size }),
    onSuccess: invalidateCart,
  });

  // Reassign who a line is for.
  const assignMut = useMutation({
    mutationFn: ({ itemId, profileId }: { itemId: string; profileId: string | null }) =>
      patchCartItem(itemId, { profile_id: profileId }),
    onSuccess: invalidateCart,
  });

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  const total = items.reduce((sum, c) => sum + (byId.get(c.product_id)?.price ?? 0), 0);

  // Confidence is now per (product × recipient): map each scored group to its
  // cart lines so a line renders its OWN nudge, once per group (first line).
  const confByLine = new Map<string, ProductConfidenceDTO>();
  (confidence?.items ?? []).forEach((it) => it.line_ids.forEach((lid) => confByLine.set(lid, it)));

  return (
    <div className="mx-auto max-w-[900px] px-6 py-12">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your bag</div>
        <h1 className="font-display text-4xl mt-2">Cart</h1>
      </div>

      <div className="mt-8 card-soft divide-y divide-border">
        {items.length === 0 && (
          <div className="p-10 text-center text-muted-foreground">
            <ShoppingBag className="size-8 mx-auto opacity-40" />
            <div className="mt-3 text-sm">Your bag is empty.</div>
            <Link to="/amazon" className="mt-4 inline-block text-sm text-primary hover:underline">
              Continue shopping →
            </Link>
          </div>
        )}
        {items.map((c) => {
          const product = byId.get(c.product_id);
          if (!product) return null;
          const removing = removeMut.isPending && removeMut.variables === c.id;
          const conf = confByLine.get(c.id);
          const showNudge = conf && conf.line_ids[0] === c.id;
          const lineBusy =
            (assignMut.isPending && assignMut.variables?.itemId === c.id) ||
            (swapSizeMut.isPending && swapSizeMut.variables?.itemId === c.id);
          return (
            <motion.div key={c.id} layout className="flex items-center gap-4 p-4">
              <img
                src={categoryImage(product.category, product.vertical)}
                alt=""
                className="size-16 rounded-lg object-cover bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  {(product.metadata as { brand?: string })?.brand ?? product.sku}
                </div>
                <div className="text-sm font-medium">{product.title}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {c.size && <span className="text-xs text-muted-foreground">Size {c.size}</span>}
                  <CartRecipientChip
                    value={c.profile_id}
                    profiles={profiles}
                    busy={lineBusy}
                    onChange={(profileId) => assignMut.mutate({ itemId: c.id, profileId })}
                  />
                </div>
                {showNudge && (
                  <CartLineNudge
                    item={conf}
                    busy={keepSizeMut.isPending || swapSizeMut.isPending}
                    onKeepSize={(keepSize, lineIds) => keepSizeMut.mutate({ keepSize, lineIds })}
                    onSwapSize={(size) => swapSizeMut.mutate({ itemId: c.id, size })}
                  />
                )}
              </div>
              <div className="text-sm tabular font-medium">
                ₹{product.price.toLocaleString("en-IN")}
              </div>
              <button
                type="button"
                onClick={() => removeMut.mutate(c.id)}
                disabled={removing}
                aria-label={`Remove ${product.title} size ${c.size ?? ""}`.trim()}
                className="size-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition shrink-0 disabled:opacity-50"
              >
                {removing ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Subtotal</div>
        <div className="font-display text-xl tabular">₹{total.toLocaleString("en-IN")}</div>
      </div>
      <button
        onClick={() => checkoutMut.mutate()}
        disabled={checkoutMut.isPending || items.length === 0}
        className="mt-4 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:bg-[var(--color-relay-hover)] transition active:scale-[0.99] disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {checkoutMut.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Placing order…
          </>
        ) : (
          "Checkout"
        )}
      </button>
      {checkoutMut.isError && (
        <div className="text-center text-xs text-red-600 mt-2">
          Checkout failed — is relay-api running on port 8010?
        </div>
      )}
      <div className="text-center text-xs text-muted-foreground mt-3">
        Free 14-day exchange ·{" "}
        <Link to="/rescue" className="text-primary hover:underline">
          Or rescue one nearby instead →
        </Link>
      </div>
    </div>
  );
}
