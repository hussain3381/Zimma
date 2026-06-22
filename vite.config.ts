import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"; // Sirf ye chahiye
import path from "path";

export default defineConfig({
  base: '/Zimma/',
  plugins: [
    TanStackRouterVite(), // Sirf ye plugin
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@components": path.resolve(__dirname, "./src/components"),
    },
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
});
