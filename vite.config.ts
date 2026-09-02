import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    base: "/Big-Data-Grupo-3/",
    nitro: {
      preset: "github-pages",
    },
  },
});