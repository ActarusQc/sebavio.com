import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // React 19 : `act` absent du build production CJS
    env: { NODE_ENV: "test" },
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.{test,spec}.{ts,tsx}",
      "tests/integration/**/*.{test,spec}.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only lève en dehors de Next — stub pour les tests unitaires
      "server-only": path.resolve(
        __dirname,
        "./node_modules/server-only/empty.js",
      ),
    },
  },
});
