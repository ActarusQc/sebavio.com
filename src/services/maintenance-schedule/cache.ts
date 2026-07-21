import { prisma } from "@/lib/prisma";
import type { MaintenanceScheduleResult } from "./types";
import { createHash } from "node:crypto";

export function buildMaintenanceCacheKey(params: {
  provider: string;
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  sourceVersion?: string | null;
}): string {
  const parts = [
    params.provider.trim().toLowerCase(),
    (params.vin ?? "").trim().toUpperCase(),
    String(params.year ?? ""),
    (params.make ?? "").trim().toLowerCase(),
    (params.model ?? "").trim().toLowerCase(),
    (params.trim ?? "").trim().toLowerCase(),
    (params.engine ?? "").trim().toLowerCase(),
    (params.sourceVersion ?? "").trim(),
  ].join("|");
  return createHash("sha256").update(parts).digest("hex");
}

export async function getCachedSchedule(
  cacheKey: string,
): Promise<MaintenanceScheduleResult | null> {
  const row = await prisma.maintenanceProviderCache.findUnique({
    where: { cacheKey },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.payload as unknown as MaintenanceScheduleResult;
}

export async function setCachedSchedule(params: {
  cacheKey: string;
  provider: string;
  vinNormalized?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  payload: MaintenanceScheduleResult;
  sourceVersion?: string | null;
  cacheHours: number;
}): Promise<void> {
  const expiresAt = new Date(
    Date.now() + Math.max(1, params.cacheHours) * 60 * 60 * 1000,
  );
  await prisma.maintenanceProviderCache.upsert({
    where: { cacheKey: params.cacheKey },
    create: {
      cacheKey: params.cacheKey,
      provider: params.provider,
      vinNormalized: params.vinNormalized ?? null,
      year: params.year ?? null,
      make: params.make ?? null,
      model: params.model ?? null,
      trim: params.trim ?? null,
      engine: params.engine ?? null,
      payload: params.payload as object,
      sourceVersion: params.sourceVersion ?? null,
      expiresAt,
    },
    update: {
      payload: params.payload as object,
      sourceVersion: params.sourceVersion ?? null,
      expiresAt,
      vinNormalized: params.vinNormalized ?? null,
      year: params.year ?? null,
      make: params.make ?? null,
      model: params.model ?? null,
      trim: params.trim ?? null,
      engine: params.engine ?? null,
    },
  });
}
