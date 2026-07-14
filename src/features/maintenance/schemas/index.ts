import { z } from "zod";
import {
  APPROACHING_DAYS,
  APPROACHING_KM,
  DEFAULT_CURRENCY,
  DEFAULT_PAGE_SIZE,
  MAINTENANCE_DOCUMENT_TYPES,
  MAINTENANCE_NOTIFICATION_TYPES,
  MAINTENANCE_PRIORITIES,
  MAX_PAGE_SIZE,
} from "@/features/maintenance/constants";

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const optionalDecimal = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nonnegative().nullable().optional());

const optionalPositiveInt = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().int().positive().nullable().optional());

const templateFields = z.object({
  modelId: z.string().uuid({ error: "Modèle invalide" }),
  title: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(50),
  intervalKm: optionalPositiveInt,
  intervalMonths: optionalPositiveInt,
  priority: z.enum(MAINTENANCE_PRIORITIES).default("normal"),
  description: optionalString(5000),
  manufacturerSource: optionalString(2000),
});

export const templateCreateSchema = templateFields.refine(
  (d) => d.intervalKm != null || d.intervalMonths != null,
  {
    message: "interval_km ou interval_months requis",
    path: ["intervalKm"],
  },
);

export const templateUpdateSchema = templateFields
  .omit({ modelId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune modification",
  });

export const historyCreateSchema = z.object({
  vehicleId: z.string().uuid({ error: "Véhicule invalide" }),
  templateId: z
    .string()
    .uuid({ error: "Gabarit invalide" })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  performedDate: z.coerce.date(),
  performedOdometer: z.coerce.number().int().min(0),
  provider: optionalString(200),
  cost: optionalDecimal,
  currency: z
    .string()
    .trim()
    .length(3)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : DEFAULT_CURRENCY)),
  notes: optionalString(5000),
});

const historyUpdateFields = z.object({
  templateId: z
    .string()
    .uuid({ error: "Gabarit invalide" })
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  performedDate: z.coerce.date().optional(),
  performedOdometer: z.coerce.number().int().min(0).optional(),
  provider: optionalString(200),
  cost: optionalDecimal,
  currency: z
    .string()
    .trim()
    .length(3)
    .nullable()
    .optional()
    .transform((v) =>
      v === "" || v === undefined ? undefined : v?.toUpperCase(),
    ),
  notes: optionalString(5000),
});

export const historyUpdateSchema = historyUpdateFields.refine(
  (data) => Object.keys(data).length > 0,
  { message: "Aucune modification" },
);
export const historyListSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export const documentCreateSchema = z.object({
  documentType: z.enum(MAINTENANCE_DOCUMENT_TYPES),
  fileUrl: z.string().url({ error: "URL invalide" }),
});

export const recalculateSchema = z.object({
  vehicleId: z.string().uuid({ error: "Véhicule invalide" }),
});

export const postponeReminderSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
  reason: optionalString(500),
  type: z.enum(MAINTENANCE_NOTIFICATION_TYPES).optional(),
});

export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type HistoryCreateInput = z.infer<typeof historyCreateSchema>;
export type HistoryUpdateInput = z.infer<typeof historyUpdateSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type RecalculateInput = z.infer<typeof recalculateSchema>;
export type PostponeReminderInput = z.infer<typeof postponeReminderSchema>;

/** Exposé pour tests de seuils. */
export const approachingThresholds = {
  days: APPROACHING_DAYS,
  km: APPROACHING_KM,
} as const;
