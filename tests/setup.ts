import "@testing-library/jest-dom/vitest";
import { config } from "dotenv";

config({ path: ".env", override: false });

// React 19 : le build production CJS n'expose pas `act`.
// dotenv peut charger NODE_ENV=production depuis .env — on force test.
try {
  Object.defineProperty(process.env, "NODE_ENV", {
    value: "test",
    writable: true,
    configurable: true,
  });
} catch {
  /* ignore si non configurable */
}
