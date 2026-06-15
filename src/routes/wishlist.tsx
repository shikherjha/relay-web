import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/wishlist")({
  component: () => <Navigate to="/genie" replace />,
});
