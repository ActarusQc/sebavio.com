import type { AnalyticsAdapter } from "../types";

/**
 * Adaptateur de diagnostic local uniquement.
 * N’envoie aucune requête externe.
 */
export const consoleAdapter: AnalyticsAdapter = {
  name: "console",
  track(input) {
    if (process.env.NODE_ENV === "production") return;
    console.info("[analytics]", input.name, input.properties ?? {});
  },
};
