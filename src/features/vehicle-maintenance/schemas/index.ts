import { z } from "zod";
import { VIN_PATTERN } from "@/services/maintenance-schedule/vin";

export const decodeVinSchema = z.object({
  vin: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => VIN_PATTERN.test(v), {
      message: "VIN invalide (17 caractères, sans I, O ni Q).",
    }),
});

export const maintenanceSyncSchema = z.object({
  forceRefresh: z.boolean().optional().default(false),
});

export const maintenanceEventCreateSchema = z.object({
  taskDefinitionId: z.string().uuid().nullable().optional(),
  serviceDate: z.coerce.date(),
  odometerKm: z.coerce.number().int().min(0),
  providerName: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  invoiceNumber: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  cost: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number().finite().nonnegative().nullable().optional()),
  currency: z
    .string()
    .trim()
    .length(3)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : "CAD")),
  notes: z
    .string()
    .trim()
    .max(5000)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  attachmentUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  status: z
    .enum(["completed", "partial", "cancelled"])
    .optional()
    .default("completed"),
});

export const maintenanceEventUpdateSchema = maintenanceEventCreateSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    message: "Aucune modification",
  });

export const dismissReminderSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
  reason: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
});

export const recallStatusSchema = z.object({
  status: z.enum([
    "open",
    "possibly_applicable",
    "repaired",
    "not_applicable",
    "dismissed",
  ]),
});

export const usageProfileUpdateSchema = z.object({
  usageProfile: z.enum(["normal", "severe", "automatic"]),
  usageFactors: z
    .object({
      shortTrips: z.boolean().optional(),
      urbanDriving: z.boolean().optional(),
      towing: z.boolean().optional(),
      heavyVehicle: z.boolean().optional(),
      dustyRoads: z.boolean().optional(),
      coldWeather: z.boolean().optional(),
      commercialUse: z.boolean().optional(),
      highAnnualKm: z.boolean().optional(),
      mountainDriving: z.boolean().optional(),
    })
    .optional(),
  annualEstimatedKm: z.coerce
    .number()
    .int()
    .min(0)
    .max(200000)
    .nullable()
    .optional(),
});

export const odometerFromTripSchema = z.object({
  tripId: z.string().uuid(),
  distanceKm: z.coerce.number().int().positive().optional(),
  confirm: z.boolean().default(false),
});

export type DecodeVinInput = z.infer<typeof decodeVinSchema>;
export type MaintenanceEventCreateInput = z.infer<
  typeof maintenanceEventCreateSchema
>;
export type DismissReminderInput = z.infer<typeof dismissReminderSchema>;
export type OdometerFromTripInput = z.infer<typeof odometerFromTripSchema>;
