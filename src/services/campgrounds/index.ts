import { AppError } from "@/lib/errors";
import { LocalCampgroundProvider } from "./local-provider";
import type { CampgroundProvider } from "./types";

export type {
  CampgroundProvider,
  CampgroundProviderAvailability,
} from "./types";
export { LocalCampgroundProvider } from "./local-provider";

let providerOverride: CampgroundProvider | null = null;

export function setCampgroundProviderForTests(
  provider: CampgroundProvider | null,
): void {
  providerOverride = provider;
}

function normalizeProviderName(raw: string | undefined): string {
  return (raw ?? "local").trim().toLowerCase();
}

/**
 * CAMPGROUND_PROVIDER=local (défaut). Autres valeurs → EXT_001 jusqu'à accord.
 */
export function createCampgroundProviderFromEnv(): CampgroundProvider {
  const name = normalizeProviderName(process.env.CAMPGROUND_PROVIDER);
  if (name === "local" || name === "" || name === "default") {
    return new LocalCampgroundProvider();
  }
  // Pas d'intégration externe sans accord explicite.
  return {
    isAvailable: () => ({
      available: false,
      provider: name,
      reason: "Fournisseur camping non configuré",
    }),
    async search() {
      throw new AppError(
        "EXT_001",
        "Fournisseur de campings indisponible",
        503,
      );
    },
    async getById() {
      throw new AppError(
        "EXT_001",
        "Fournisseur de campings indisponible",
        503,
      );
    },
  };
}

export function getCampgroundProvider(): CampgroundProvider {
  return providerOverride ?? createCampgroundProviderFromEnv();
}
