import { createHash } from "node:crypto";
import { z } from "zod";
import {
  MAINTENANCE_ACTION_TYPES,
  MAINTENANCE_CATEGORIES,
  MAINTENANCE_CONDITION_TYPES,
  MAINTENANCE_TASK_PRIORITIES,
  type MaintenanceScheduleResult,
  type NormalizedMaintenanceTask,
} from "./types";

const KM_PER_MILE = 1.60934;

export function milesToKm(miles: number): number {
  return Math.round(miles * KM_PER_MILE);
}

export function hashSchedulePayload(
  provider: string,
  tasks: NormalizedMaintenanceTask[],
): string {
  const canonical = JSON.stringify({
    provider,
    tasks: tasks.map((t) => ({
      externalId: t.externalId ?? null,
      category: t.category,
      title: t.title,
      actionType: t.actionType,
      intervalKm: t.intervalKm ?? null,
      intervalMonths: t.intervalMonths ?? null,
      firstDueKm: t.firstDueKm ?? null,
      firstDueMonths: t.firstDueMonths ?? null,
      conditionType: t.conditionType,
      priority: t.priority,
      official: t.officialManufacturerRecommendation,
      inspectionOnly: t.inspectionOnly,
    })),
  });
  return createHash("sha256").update(canonical).digest("hex");
}

const rawTaskSchema = z.object({
  externalId: z.string().max(120).optional(),
  category: z.enum(MAINTENANCE_CATEGORIES).catch("other"),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  actionType: z.enum(MAINTENANCE_ACTION_TYPES).catch("service"),
  intervalKm: z.number().int().positive().optional(),
  intervalMiles: z.number().positive().optional(),
  intervalMonths: z.number().int().positive().optional(),
  firstDueKm: z.number().int().positive().optional(),
  firstDueMiles: z.number().positive().optional(),
  firstDueMonths: z.number().int().positive().optional(),
  conditionType: z.enum(MAINTENANCE_CONDITION_TYPES).catch("both"),
  priority: z.enum(MAINTENANCE_TASK_PRIORITIES).catch("medium"),
  officialManufacturerRecommendation: z.boolean().optional(),
  inspectionOnly: z.boolean().optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
  sourceReference: z.string().max(255).optional(),
});

export const commercialScheduleResponseSchema = z.object({
  providerVehicleId: z.string().max(120).optional(),
  sourceReference: z.string().max(255).optional(),
  sourceVersion: z.string().max(80).optional(),
  normalConditions: z.boolean().optional(),
  severeConditions: z.boolean().optional(),
  tasks: z.array(rawTaskSchema).max(500),
});

export type CommercialScheduleResponse = z.infer<
  typeof commercialScheduleResponseSchema
>;

/**
 * Normalise une tâche fournisseur vers le format interne (km, mois, CAD implicite).
 * Ne force jamais officialManufacturerRecommendation=true sauf si le payload le dit
 * explicitement et que le fournisseur commercial est digne de confiance.
 */
export function normalizeRawTask(
  raw: z.infer<typeof rawTaskSchema>,
  opts?: { forceUnofficial?: boolean },
): NormalizedMaintenanceTask {
  const intervalKm =
    raw.intervalKm ??
    (raw.intervalMiles != null ? milesToKm(raw.intervalMiles) : undefined);
  const firstDueKm =
    raw.firstDueKm ??
    (raw.firstDueMiles != null ? milesToKm(raw.firstDueMiles) : undefined);

  const inspectionOnly =
    raw.inspectionOnly === true || raw.actionType === "inspect";

  let official = raw.officialManufacturerRecommendation === true;
  if (opts?.forceUnofficial) {
    official = false;
  }

  return {
    externalId: raw.externalId,
    category: raw.category,
    title: raw.title,
    description: raw.description,
    actionType:
      inspectionOnly && raw.actionType === "replace"
        ? "inspect"
        : raw.actionType,
    intervalKm,
    intervalMonths: raw.intervalMonths,
    firstDueKm,
    firstDueMonths: raw.firstDueMonths,
    conditionType: raw.conditionType,
    priority: raw.priority,
    officialManufacturerRecommendation: official,
    inspectionOnly,
    estimatedDurationMinutes: raw.estimatedDurationMinutes,
    notes: raw.notes,
    sourceReference: raw.sourceReference,
  };
}

export function normalizeCommercialResponse(
  providerName: string,
  data: CommercialScheduleResponse,
  opts?: { forceUnofficial?: boolean },
): MaintenanceScheduleResult {
  const tasks = data.tasks.map((t) => normalizeRawTask(t, opts));
  return {
    providerName,
    providerVehicleId: data.providerVehicleId,
    sourceType: "commercial",
    sourceReference: data.sourceReference,
    sourceVersion: data.sourceVersion,
    normalConditions: data.normalConditions ?? true,
    severeConditions: data.severeConditions ?? false,
    tasks,
    rawDataHash: hashSchedulePayload(providerName, tasks),
  };
}
