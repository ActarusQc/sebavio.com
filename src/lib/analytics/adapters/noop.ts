import type { AnalyticsAdapter } from "../types";

/** Adaptateur par défaut : aucune requête réseau. */
export const noopAdapter: AnalyticsAdapter = {
  name: "noop",
  track() {
    // no-op
  },
};
