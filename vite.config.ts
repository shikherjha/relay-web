import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    // TanStack Start's plugin must come before React's.
    tanstackStart({ srcDirectory: "src" }),
    viteReact(),
    // nitro's dev-worker has a cold-start SSR race (throws "Vite environment
    // 'ssr' is unavailable"); use it only for the production build, where it
    // generates the deployable .output. `vite dev` uses Start's own SSR server.
    ...(command === "build" ? [nitro()] : []),
  ],
}));
