import { createFileRoute, redirect } from "@tanstack/react-router";

// The Amazon (Layer-1) cart now lives under the Amazon layer at /amazon/cart so
// it keeps the Amazon nav/chrome. The Relay (Second-Life + Rescue) cart is a
// separate route at /relay-cart. This legacy path just forwards to the Amazon one.
export const Route = createFileRoute("/cart")({
  beforeLoad: () => {
    throw redirect({ to: "/amazon/cart" });
  },
});
