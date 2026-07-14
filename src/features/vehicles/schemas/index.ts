import { z } from "zod";
import { VEHICLE_CATEGORIES } from "@/features/vehicle-catalog/constants";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  TOLL_PREFERENCES,
  USER_DOCUMENT_TYPES,
  VIN_REGEX,
} from "@/features/vehicles/constants";

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
}, z.number().finite().nullable().optional());

const optionalDate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}, z.coerce.date().nullable().optional());

const vinSchema = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") return v.trim().toUpperCase();
    return v;
  },
  z.string().regex(VIN_REGEX, { error: "VIN invalide" }).nullable().optional(),
);

const uuidOrNull = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return null;
    return v;
  },
  z.string().uuid({ error: "Identifiant invalide" }).nullable().optional(),
);

function refineCatalogOrManual(
  data: {
    modelId?: string | null;
    isManualEntry?: boolean;
    manualManufacturerName?: string | null;
    manualModelName?: string | null;
    manualYear?: number | null;
  },
  ctx: z.RefinementCtx,
  mode: "create" | "update",
) {
  const isManual =
    data.isManualEntry === true ||
    (data.modelId === null && data.isManualEntry !== false);

  if (mode === "create") {
    if (data.modelId) {
      if (data.isManualEntry === true) {
        ctx.addIssue({
          code: "custom",
          message: "Choisir catalogue OU saisie manuelle",
          path: ["isManualEntry"],
        });
      }
      return;
    }

    if (!isManual && !data.modelId) {
      ctx.addIssue({
        code: "custom",
        message: "Modèle catalogue ou saisie manuelle requis",
        path: ["modelId"],
      });
      return;
    }

    if (!data.manualManufacturerName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Marque requise en saisie manuelle",
        path: ["manualManufacturerName"],
      });
    }
    if (!data.manualModelName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Modèle requis en saisie manuelle",
        path: ["manualModelName"],
      });
    }
    if (data.manualYear == null) {
      ctx.addIssue({
        code: "custom",
        message: "Année requise en saisie manuelle",
        path: ["manualYear"],
      });
    }
    return;
  }

  // update : si modelId explicitement null → manuels requis
  if (data.modelId === null) {
    if (!data.manualManufacturerName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Marque requise en saisie manuelle",
        path: ["manualManufacturerName"],
      });
    }
    if (!data.manualModelName?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Modèle requis en saisie manuelle",
        path: ["manualModelName"],
      });
    }
    if (data.manualYear == null) {
      ctx.addIssue({
        code: "custom",
        message: "Année requise en saisie manuelle",
        path: ["manualYear"],
      });
    }
  }
}

const vehicleBaseFields = {
  nickname: optionalString(100),
  vin: vinSchema,
  licensePlate: optionalString(20),
  purchaseDate: optionalDate,
  purchasePrice: optionalDecimal,
  realAvgConsumption: optionalDecimal,
  tankCapacityOverride: optionalDecimal,
  manualManufacturerName: optionalString(150),
  manualModelName: optionalString(150),
  manualYear: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number().int().min(1950).max(2100).nullable().optional()),
  manualCategory: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(VEHICLE_CATEGORIES).nullable().optional(),
  ),
  manualTrim: optionalString(150),
  primaryVehicle: z.boolean().optional(),
};

export const vehicleCreateSchema = z
  .object({
    modelId: uuidOrNull,
    isManualEntry: z.boolean().optional(),
    currentOdometer: z.coerce
      .number()
      .int({ error: "Kilométrage invalide" })
      .min(0, { error: "Kilométrage invalide" }),
    ...vehicleBaseFields,
  })
  .superRefine((data, ctx) => refineCatalogOrManual(data, ctx, "create"));

export const vehicleUpdateSchema = z
  .object({
    modelId: uuidOrNull,
    isManualEntry: z.boolean().optional(),
    currentOdometer: z.coerce
      .number()
      .int({ error: "Kilométrage invalide" })
      .min(0, { error: "Kilométrage invalide" })
      .optional(),
    ...vehicleBaseFields,
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "Aucun champ à mettre à jour",
  })
  .superRefine((data, ctx) => refineCatalogOrManual(data, ctx, "update"));

export const odometerUpdateSchema = z.object({
  currentOdometer: z.coerce
    .number()
    .int({ error: "Kilométrage invalide" })
    .min(0, { error: "Kilométrage invalide" }),
});

export const vehiclePhotoCreateSchema = z.object({
  photoUrl: z.string().trim().url({ error: "URL photo invalide" }).max(2000),
  caption: optionalString(200),
  displayOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const vehicleDocumentCreateSchema = z.object({
  type: z.enum(USER_DOCUMENT_TYPES, { error: "Type de document invalide" }),
  title: z.string().trim().min(1, { error: "Titre requis" }).max(150),
  fileUrl: z.string().trim().url({ error: "URL document invalide" }).max(2000),
  expiryDate: optionalDate,
});

export const vehicleSettingsUpdateSchema = z.object({
  preferredFuelType: optionalString(30),
  winterMode: z.boolean().optional(),
  avoidUnpavedRoads: z.boolean().optional(),
  tollPreference: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    z.enum(TOLL_PREFERENCES).nullable().optional(),
  ),
});

export const vehiclesListSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .optional()
    .default(DEFAULT_PAGE_SIZE),
});

export type VehicleCreateInput = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type OdometerUpdateInput = z.infer<typeof odometerUpdateSchema>;
export type VehiclePhotoCreateInput = z.infer<typeof vehiclePhotoCreateSchema>;
export type VehicleDocumentCreateInput = z.infer<
  typeof vehicleDocumentCreateSchema
>;
export type VehicleSettingsUpdateInput = z.infer<
  typeof vehicleSettingsUpdateSchema
>;
export type VehiclesListInput = z.infer<typeof vehiclesListSchema>;
