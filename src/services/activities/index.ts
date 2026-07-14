import { AppError } from "@/lib/errors";
import { LocalActivityProvider } from "./local-provider";
import type { ActivityProvider } from "./types";

export type { ActivityProvider, ActivityProviderAvailability } from "./types";
export { LocalActivityProvider } from "./local-provider";

let providerOverride: ActivityProvider | null = null;

export function setActivityProviderForTests(
  provider: ActivityProvider | null,
): void {
  providerOverride = provider;
}

function normalizeProviderName(raw: string | undefined): string {
  return (raw ?? "local").trim().toLowerCase();
}

/**
 * ACTIVITY_PROVIDER=local (défaut). Autres valeurs → EXT_001 jusqu'à accord.
 */
export function createActivityProviderFromEnv(): ActivityProvider {
  const name = normalizeProviderName(process.env.ACTIVITY_PROVIDER);
  if (name === "local" || name === "" || name === "default") {
    return new LocalActivityProvider();
  }
  return {
    isAvailable: () => ({
      available: false,
      provider: name,
      reason: "Fournisseur activités non configuré",
    }),
    async search() {
      throw new AppError(
        "EXT_001",
        "Fournisseur d'activités indisponible",
        503,
      );
    },
    async getById() {
      throw new AppError(
        "EXT_001",
        "Fournisseur d'activités indisponible",
        503,
      );
    },
  };
}

export function getActivityProvider(): ActivityProvider {
  return providerOverride ?? createActivityProviderFromEnv();
}
