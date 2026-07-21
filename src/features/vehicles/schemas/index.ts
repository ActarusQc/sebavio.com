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
  if (typeof v === "string") {
    const normalized = v.trim().replace(/\s/g, "").replace(",", ".");
    if (normalized === "") return null;
    return Number(normalized);
  }
  return v;
}, z.number().finite().nullable().optional());

/** Consommation thermique personnalisée : 1–100 L/100 km, 2 décimales. */
const customConsumptionSchema = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") {
    const normalized = v.trim().replace(/\s/g, "").replace(",", ".");
    if (normalized === "") return null;
    const n = Number(normalized);
    if (!Number.isFinite(n)) return n;
    return Math.round(n * 100) / 100;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.round(v * 100) / 100;
  }
  return v;
}, z.number().min(1).max(100).nullable().optional());

const specOverridesSchema = z
  .object({
    lengthM: optionalDecimal,
    widthM: optionalDecimal,
    heightM: optionalDecimal,
    weightKg: optionalDecimal,
    electricRangeKm: optionalDecimal,
    batteryCapacityKwh: optionalDecimal,
  })
  .partial()
  .nullable()
  .optional();

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
    catalogEntryId?: string | null;
    isManualEntry?: boolean;
    manualManufacturerName?: string | null;
    manualModelName?: string | null;
    manualYear?: number | null;
    officialCombinedConsumptionL100?: number | null;
    fuelType?: string | null;
  },
  ctx: z.RefinementCtx,
  mode: "create" | "update",
) {
  const isManual = data.isManualEntry === true;
  const hasNrcan = Boolean(data.catalogEntryId);
  const hasLegacyModel = Boolean(data.modelId);

  if (mode === "create") {
    if (hasNrcan) {
      if (isManual) {
        ctx.addIssue({
          code: "custom",
          message: "Choisir catalogue NRCan OU saisie manuelle",
          path: ["isManualEntry"],
        });
      }
      return;
    }

    if (hasLegacyModel) {
      if (isManual) {
        ctx.addIssue({
          code: "custom",
          message: "Choisir catalogue OU saisie manuelle",
          path: ["isManualEntry"],
        });
      }
      return;
    }

    if (!isManual) {
      ctx.addIssue({
        code: "custom",
        message: "Configuration catalogue ou saisie manuelle requise",
        path: ["catalogEntryId"],
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
    if (
      data.officialCombinedConsumptionL100 == null ||
      data.officialCombinedConsumptionL100 <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Consommation combinée requise en saisie manuelle",
        path: ["officialCombinedConsumptionL100"],
      });
    }
    return;
  }

  if (data.catalogEntryId) return;

  if (data.modelId === null || isManual) {
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

const fuelTypeSchema = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z
    .enum([
      "regular",
      "premium",
      "diesel",
      "ethanol",
      "natural_gas",
      "electric",
      "hybrid",
      "plugin_hybrid",
    ])
    .nullable()
    .optional(),
);

const vehicleBaseFields = {
  nickname: optionalString(100),
  vin: vinSchema,
  licensePlate: optionalString(20),
  purchaseDate: optionalDate,
  purchasePrice: optionalDecimal,
  realAvgConsumption: optionalDecimal,
  customConsumptionL100: customConsumptionSchema,
  tankCapacityOverride: optionalDecimal,
  manufacturerTankCapacityL: optionalDecimal,
  fuelType: fuelTypeSchema,
  manufacturerFuelType: fuelTypeSchema,
  customFuelType: fuelTypeSchema,
  officialCityConsumptionL100: optionalDecimal,
  officialHighwayConsumptionL100: optionalDecimal,
  officialCombinedConsumptionL100: optionalDecimal,
  consumptionDataSource: optionalString(40),
  specOverrides: specOverridesSchema,
  resetAllManufacturerSpecs: z.boolean().optional(),
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
  engine: optionalString(150),
  transmission: optionalString(80),
  drivetrain: optionalString(80),
  vehicleType: optionalString(80),
  bodyClass: optionalString(80),
  manufacturerName: optionalString(150),
  plantCountry: optionalString(80),
  cylinders: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number().int().positive().nullable().optional()),
  displacementL: optionalDecimal,
  annualEstimatedKm: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string") return Number(v);
    return v;
  }, z.number().int().min(0).max(200000).nullable().optional()),
  inServiceDate: optionalDate,
  identificationSource: optionalString(30),
  identificationConfidence: optionalString(20),
  usageProfile: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.enum(["normal", "severe", "automatic"]).optional(),
  ),
};

export const vehicleCreateSchema = z
  .object({
    modelId: uuidOrNull,
    catalogEntryId: uuidOrNull,
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
    catalogEntryId: uuidOrNull,
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
  type: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? "Autre" : v),
    z.enum(USER_DOCUMENT_TYPES, { error: "Type de document invalide" }),
  ),
  title: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return "Sans titre";
    return v;
  }, z.string().trim().max(150)),
  /** Conservé en base (colonne non nulle) — plus saisi dans l’UI. */
  fileUrl: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? "" : v),
    z.string().trim().max(2000),
  ),
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
