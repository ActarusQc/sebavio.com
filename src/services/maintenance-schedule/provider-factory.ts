import { AppError } from "@/lib/errors";
import {
  buildMaintenanceCacheKey,
  getCachedSchedule,
  setCachedSchedule,
} from "./cache";
import { CommercialMaintenanceProvider } from "./commercial-provider";
import { ManualFallbackProvider } from "./manual-fallback-provider";
import { MockMaintenanceProvider } from "./mock-provider";
import type {
  MaintenanceScheduleProvider,
  MaintenanceScheduleResult,
  MaintenanceVehicleInput,
} from "./types";

let providerOverride: MaintenanceScheduleProvider | null = null;

export function setMaintenanceProviderForTests(
  provider: MaintenanceScheduleProvider | null,
): void {
  providerOverride = provider;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.MAINTENANCE_ALLOW_MOCK !== "true"
  );
}

/**
 * MAINTENANCE_PROVIDER=mock|commercial|manual
 * Mock interdit en production (même si demandé).
 */
export function createMaintenanceProviderFromEnv(): MaintenanceScheduleProvider {
  const name = (process.env.MAINTENANCE_PROVIDER ?? "mock")
    .trim()
    .toLowerCase();

  if (name === "mock") {
    const forbidden =
      process.env.MAINTENANCE_FORBID_MOCK === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.MAINTENANCE_ALLOW_MOCK !== "true");
    if (forbidden) {
      throw new AppError(
        "MNT_010",
        "Le fournisseur mock d’entretien est interdit en production.",
        500,
      );
    }
    return new MockMaintenanceProvider();
  }

  if (name === "manual" || name === "off" || name === "none") {
    return new ManualFallbackProvider();
  }

  const baseUrl = process.env.MAINTENANCE_PROVIDER_BASE_URL?.trim() ?? "";
  const apiKey = process.env.MAINTENANCE_PROVIDER_API_KEY?.trim() ?? "";

  if (!baseUrl || !apiKey) {
    if (isProduction()) {
      throw new AppError(
        "MNT_007",
        "Aucun fournisseur commercial d’entretien configuré. Ajoutez vos entretiens manuellement ou configurez MAINTENANCE_PROVIDER_*.",
        503,
      );
    }
    return new ManualFallbackProvider();
  }

  return new CommercialMaintenanceProvider({
    baseUrl,
    apiKey,
    timeoutMs: envInt("MAINTENANCE_PROVIDER_TIMEOUT_MS", 10000),
    maxRetries: envInt("MAINTENANCE_PROVIDER_MAX_RETRIES", 2),
    providerLabel: name === "commercial" ? "commercial" : name,
  });
}

export function resolveMaintenanceProvider(): MaintenanceScheduleProvider {
  return providerOverride ?? createMaintenanceProviderFromEnv();
}

export type ScheduleFetchResult = {
  result: MaintenanceScheduleResult;
  fromCache: boolean;
  staleFallback: boolean;
  errorMessage?: string;
};

/**
 * Récupère un calendrier avec cache + fallback sur dernier résultat valide.
 */
export async function getScheduleWithCacheAndFallback(
  input: MaintenanceVehicleInput,
  opts?: { forceRefresh?: boolean },
): Promise<ScheduleFetchResult> {
  const provider = resolveMaintenanceProvider();
  const cacheHours = envInt("MAINTENANCE_PROVIDER_CACHE_HOURS", 168);
  const cacheKey = buildMaintenanceCacheKey({
    provider: provider.providerName,
    vin: input.vin,
    year: input.year,
    make: input.make ?? input.manufacturer,
    model: input.model,
    trim: input.trim,
    engine: input.engine,
  });

  if (!opts?.forceRefresh) {
    const cached = await getCachedSchedule(cacheKey);
    if (cached) {
      return {
        result: { ...cached, sourceType: "cached" },
        fromCache: true,
        staleFallback: false,
      };
    }
  }

  try {
    const result = await provider.getSchedule(input);
    await setCachedSchedule({
      cacheKey,
      provider: provider.providerName,
      vinNormalized: input.vin ?? null,
      year: input.year ?? null,
      make: input.make ?? input.manufacturer ?? null,
      model: input.model ?? null,
      trim: input.trim ?? null,
      engine: input.engine ?? null,
      payload: result,
      sourceVersion: result.sourceVersion,
      cacheHours,
    });
    return { result, fromCache: false, staleFallback: false };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Erreur fournisseur d’entretien";

    console.error("[maintenance-schedule] provider failure", {
      provider: provider.providerName,
      message,
    });

    const stale = await getCachedSchedule(cacheKey);
    if (stale) {
      return {
        result: {
          ...stale,
          sourceType: "cached",
          warning:
            "Les données n’ont pas pu être actualisées. Affichage du dernier calendrier valide.",
        },
        fromCache: true,
        staleFallback: true,
        errorMessage: message,
      };
    }

    if (error instanceof AppError) throw error;
    throw new AppError("MNT_008", message, 502);
  }
}
