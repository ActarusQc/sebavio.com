import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import {
  createAiProvider,
  getAiRuntimeConfig,
  isAiFeatureEnabled,
} from "@/services/ai";
import { buildSpecsEstimateCacheKey } from "@/features/vehicles/lib/specs-estimate-cache-key";
import {
  vehicleSpecsEstimateAiPayloadSchema,
  vehicleSpecsEstimateRequestSchema,
  type VehicleSpecsEstimateRequest,
  type VehicleSpecsEstimateResult,
  type VehicleSpecsEstimateSource,
} from "@/features/vehicles/schemas";

const REDIS_TTL_SECONDS = 90 * 24 * 60 * 60;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type CachedEstimate = {
  consumptionL100: number | null;
  tankCapacityL: number | null;
  consumptionSource: VehicleSpecsEstimateSource | null;
  tankCapacitySource: VehicleSpecsEstimateSource | null;
  confidence: "high" | "medium" | "low" | null;
};

function decimalToNumber(
  value: { toString(): string } | number | null | undefined,
): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

function clampConsumption(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 1 || n > 100) return null;
  return Math.round(n * 100) / 100;
}

function clampTank(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  if (n < 10 || n > 500) return null;
  return Math.round(n * 10) / 10;
}

export async function assertSpecsEstimateRateLimit(
  userId: string,
): Promise<void> {
  const key = `veh:rl:specs-estimate:${userId}`;
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (count > RATE_LIMIT_MAX) {
      throw new AppError(
        "EXT_RATE_LIMIT",
        "Trop de requêtes d’estimation. Réessayez dans une minute.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Redis indisponible : ne pas bloquer le parcours création.
  }
}

async function readRedisCache(
  cacheKey: string,
): Promise<CachedEstimate | null> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") await redis.connect();
    const raw = await redis.get(`veh:spec-est:${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEstimate;
    return parsed;
  } catch {
    return null;
  }
}

async function writeRedisCache(
  cacheKey: string,
  value: CachedEstimate,
): Promise<void> {
  try {
    const redis = getRedis();
    if (redis.status !== "ready") await redis.connect();
    await redis.set(
      `veh:spec-est:${cacheKey}`,
      JSON.stringify(value),
      "EX",
      REDIS_TTL_SECONDS,
    );
  } catch {
    // ignore
  }
}

async function readDbCache(cacheKey: string): Promise<CachedEstimate | null> {
  const row = await prisma.vehicleSpecEstimate.findFirst({
    where: { cacheKey, deletedAt: null },
  });
  if (!row) return null;
  return {
    consumptionL100: clampConsumption(decimalToNumber(row.consumptionL100)),
    tankCapacityL: clampTank(decimalToNumber(row.tankCapacityL)),
    consumptionSource:
      (row.consumptionSource as VehicleSpecsEstimateSource | null) ?? null,
    tankCapacitySource:
      (row.tankCapacitySource as VehicleSpecsEstimateSource | null) ?? null,
    confidence: (row.confidence as CachedEstimate["confidence"] | null) ?? null,
  };
}

async function writeDbCache(
  input: VehicleSpecsEstimateRequest,
  cacheKey: string,
  value: CachedEstimate,
): Promise<void> {
  await prisma.vehicleSpecEstimate.upsert({
    where: { cacheKey },
    create: {
      cacheKey,
      catalogEntryId: input.catalogEntryId ?? null,
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      configuration: input.configuration ?? null,
      consumptionL100: value.consumptionL100,
      tankCapacityL: value.tankCapacityL,
      consumptionSource: value.consumptionSource,
      tankCapacitySource: value.tankCapacitySource,
      confidence: value.confidence,
      deletedAt: null,
    },
    update: {
      catalogEntryId: input.catalogEntryId ?? null,
      make: input.make ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      configuration: input.configuration ?? null,
      consumptionL100: value.consumptionL100,
      tankCapacityL: value.tankCapacityL,
      consumptionSource: value.consumptionSource,
      tankCapacitySource: value.tankCapacitySource,
      confidence: value.confidence,
      deletedAt: null,
    },
  });
}

const AI_SYSTEM_PROMPT = `Tu estimes les spécifications carburant d'un véhicule (marché nord-américain / canadien).
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown :
{"consumptionL100": number|null, "tankCapacityL": number|null, "confidence": "high"|"medium"|"low", "isFullyElectric": boolean}
Règles :
- consumptionL100 = consommation combinée en L/100 km (1–100). null si 100% électrique.
- tankCapacityL = capacité réservoir essence/diesel en litres (10–500). null si BEV sans réservoir.
- Ne invente pas de L/100 km pour un BEV (isFullyElectric=true → consumptionL100=null).
- Sois réaliste pour la marque/modèle/année/configuration fournis.`;

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("json_parse_failed");
  }
}

async function estimateWithAi(input: {
  make: string;
  model: string;
  year: number;
  configuration?: string | null;
  fuelType?: string | null;
  needConsumption: boolean;
  needTank: boolean;
}): Promise<{
  consumptionL100: number | null;
  tankCapacityL: number | null;
  confidence: CachedEstimate["confidence"];
  isFullyElectric: boolean;
}> {
  if (!isAiFeatureEnabled()) {
    return {
      consumptionL100: null,
      tankCapacityL: null,
      confidence: null,
      isFullyElectric: false,
    };
  }

  const config = getAiRuntimeConfig();
  const provider = createAiProvider();
  const userPayload = JSON.stringify({
    make: input.make,
    model: input.model,
    year: input.year,
    configuration: input.configuration ?? null,
    fuelType: input.fuelType ?? null,
    needConsumption: input.needConsumption,
    needTank: input.needTank,
  });

  try {
    const result = await provider.generateRawJsonResponse({
      systemPrompt: AI_SYSTEM_PROMPT,
      userPayload,
      model: config.model,
      timeoutMs: Math.min(config.timeoutMs, 25_000),
    });
    const parsed = vehicleSpecsEstimateAiPayloadSchema.safeParse(
      extractJsonObject(result.rawText),
    );
    if (!parsed.success) {
      return {
        consumptionL100: null,
        tankCapacityL: null,
        confidence: null,
        isFullyElectric: false,
      };
    }
    const isFullyElectric = parsed.data.isFullyElectric === true;
    return {
      consumptionL100: isFullyElectric
        ? null
        : clampConsumption(parsed.data.consumptionL100 ?? null),
      tankCapacityL: clampTank(parsed.data.tankCapacityL ?? null),
      confidence: parsed.data.confidence ?? "medium",
      isFullyElectric,
    };
  } catch {
    return {
      consumptionL100: null,
      tankCapacityL: null,
      confidence: null,
      isFullyElectric: false,
    };
  }
}

/**
 * Estime / résout consommation + capacité réservoir.
 * Ordre : NRCan / catalogue → cache → IA.
 */
export async function estimateVehicleSpecs(
  raw: unknown,
): Promise<VehicleSpecsEstimateResult> {
  const input = vehicleSpecsEstimateRequestSchema.parse(raw);

  let catalog: {
    id: string;
    make: string;
    model: string;
    modelYear: number;
    configuration: string | null;
    normalizedFuelType: string | null;
    combinedConsumptionL100Km: Prisma.Decimal | null;
    fuelTankCapacityL: Prisma.Decimal | null;
  } | null = null;

  if (input.catalogEntryId) {
    catalog = await prisma.vehicleCatalogEntry.findFirst({
      where: { id: input.catalogEntryId, isActive: true },
      select: {
        id: true,
        make: true,
        model: true,
        modelYear: true,
        configuration: true,
        normalizedFuelType: true,
        combinedConsumptionL100Km: true,
        fuelTankCapacityL: true,
      },
    });
    if (!catalog) {
      throw new AppError("VEH_001", "Configuration catalogue introuvable", 404);
    }
  }

  const make = catalog?.make ?? input.make ?? "";
  const model = catalog?.model ?? input.model ?? "";
  const year = catalog?.modelYear ?? input.year ?? null;
  const configuration = catalog?.configuration ?? input.configuration ?? null;
  const fuelType = catalog?.normalizedFuelType ?? input.fuelType ?? null;

  const cacheKey = buildSpecsEstimateCacheKey({
    catalogEntryId: catalog?.id ?? input.catalogEntryId,
    make,
    model,
    year,
    configuration,
  });

  let consumptionL100 = clampConsumption(
    decimalToNumber(catalog?.combinedConsumptionL100Km),
  );
  let consumptionSource: VehicleSpecsEstimateSource | null =
    consumptionL100 != null ? "nrcan" : null;

  let tankCapacityL = clampTank(decimalToNumber(catalog?.fuelTankCapacityL));
  let tankCapacitySource: VehicleSpecsEstimateSource | null =
    tankCapacityL != null ? "nrcan" : null;

  let confidence: CachedEstimate["confidence"] =
    consumptionL100 != null ? "high" : null;

  if (consumptionL100 == null || tankCapacityL == null) {
    const cached =
      (await readRedisCache(cacheKey)) ?? (await readDbCache(cacheKey));
    if (cached) {
      if (consumptionL100 == null && cached.consumptionL100 != null) {
        consumptionL100 = cached.consumptionL100;
        consumptionSource = cached.consumptionSource ?? "catalog_cache";
      }
      if (tankCapacityL == null && cached.tankCapacityL != null) {
        tankCapacityL = cached.tankCapacityL;
        tankCapacitySource = cached.tankCapacitySource ?? "catalog_cache";
      }
      if (confidence == null) confidence = cached.confidence;
    }
  }

  const needConsumption = consumptionL100 == null;
  const needTank = tankCapacityL == null;
  const isElectricFuel =
    fuelType === "electric" ||
    String(fuelType ?? "")
      .toLowerCase()
      .includes("electric");

  if ((needConsumption || needTank) && year != null && make && model) {
    // BEV : ne pas demander de conso L/100 à l’IA
    const ai = await estimateWithAi({
      make,
      model,
      year,
      configuration,
      fuelType,
      needConsumption: needConsumption && !isElectricFuel,
      needTank,
    });

    if (needConsumption && !isElectricFuel && ai.consumptionL100 != null) {
      consumptionL100 = ai.consumptionL100;
      consumptionSource = "ai_estimate";
    }
    if (needTank && ai.tankCapacityL != null) {
      tankCapacityL = ai.tankCapacityL;
      tankCapacitySource = "ai_estimate";
    }
    if (ai.confidence) confidence = ai.confidence;
    if (ai.isFullyElectric && needConsumption) {
      consumptionL100 = null;
      consumptionSource = null;
    }
  }

  const result: CachedEstimate = {
    consumptionL100,
    tankCapacityL,
    consumptionSource,
    tankCapacitySource,
    confidence,
  };

  if (result.consumptionL100 != null || result.tankCapacityL != null) {
    await writeRedisCache(cacheKey, result);
    await writeDbCache(
      {
        ...input,
        make,
        model,
        year,
        configuration,
        catalogEntryId: catalog?.id ?? input.catalogEntryId ?? null,
      },
      cacheKey,
      result,
    );
  }

  if (
    catalog &&
    result.tankCapacityL != null &&
    catalog.fuelTankCapacityL == null
  ) {
    await prisma.vehicleCatalogEntry.update({
      where: { id: catalog.id },
      data: { fuelTankCapacityL: result.tankCapacityL },
    });
  }

  return {
    consumptionL100: result.consumptionL100,
    tankCapacityL: result.tankCapacityL,
    sources: {
      consumption: result.consumptionSource,
      tankCapacity: result.tankCapacitySource,
    },
    confidence: result.confidence,
  };
}
