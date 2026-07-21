import { z } from "zod";

const optionalPositiveNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().positive().nullable().optional());

const optionalNonNegNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().min(0).nullable().optional());

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

function assertNotFutureDate(date: Date): boolean {
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const d = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  return d <= todayUtc;
}

const fuelAmountFields = {
  liters: optionalPositiveNumber,
  pricePerLiter: optionalPositiveNumber,
  totalCost: optionalPositiveNumber,
};

export const fuelLogCreateSchema = z
  .object({
    vehicleId: z.string().uuid({ error: "Véhicule invalide" }),
    filledAt: z.coerce.date().refine(assertNotFutureDate, {
      message: "La date du plein ne peut pas être dans le futur",
    }),
    odometerKm: z.coerce.number().int().min(0),
    isFull: z
      .preprocess((v) => {
        if (v === "true" || v === true || v === "1" || v === 1) return true;
        if (v === "false" || v === false || v === "0" || v === 0) return false;
        return v;
      }, z.boolean())
      .default(true),
    fuelType: optionalString(30),
    stationName: optionalString(200),
    notes: optionalString(5000),
    ...fuelAmountFields,
  })
  .superRefine((data, ctx) => {
    const count = [data.liters, data.pricePerLiter, data.totalCost].filter(
      (v) => v != null,
    ).length;
    if (count < 2) {
      ctx.addIssue({
        code: "custom",
        message: "Indiquez au moins deux valeurs parmi litres, prix/L et total",
        path: ["liters"],
      });
    }
  });

export const fuelLogUpdateSchema = z
  .object({
    filledAt: z.coerce
      .date()
      .refine(assertNotFutureDate, {
        message: "La date du plein ne peut pas être dans le futur",
      })
      .optional(),
    odometerKm: z.coerce.number().int().min(0).optional(),
    isFull: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      if (v === "true" || v === true || v === "1" || v === 1) return true;
      if (v === "false" || v === false || v === "0" || v === 0) return false;
      return v;
    }, z.boolean().optional()),
    fuelType: optionalString(30),
    stationName: optionalString(200),
    notes: optionalString(5000),
    ...fuelAmountFields,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Aucune modification",
  });

/** Types carburant sélectionnables pour un calcul de voyage. */
export const tripFuelTypeSchema = z.enum([
  "regular",
  "midGrade",
  "premium",
  "diesel",
  "ethanol",
  "other",
]);

export const initialFuelSchema = z
  .object({
    mode: z.enum([
      "full",
      "empty",
      "quarter",
      "half",
      "three_quarters",
      "percentage",
      "litres",
    ]),
    value: z.number().finite().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "percentage") {
      if (data.value == null || data.value < 0 || data.value > 100) {
        ctx.addIssue({
          code: "custom",
          message: "Pourcentage initial entre 0 et 100 requis",
          path: ["value"],
        });
      }
    }
    if (data.mode === "litres" && (data.value == null || data.value < 0)) {
      ctx.addIssue({
        code: "custom",
        message: "Litres initiaux requis",
        path: ["value"],
      });
    }
  });

export const departureRefillSchema = z
  .object({
    mode: z.enum(["automatic", "manual_total", "none"]),
    manualTotal: optionalNonNegNumber,
  })
  .superRefine((data, ctx) => {
    if (
      data.mode === "manual_total" &&
      (data.manualTotal == null || data.manualTotal < 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Montant du plein de départ requis",
        path: ["manualTotal"],
      });
    }
  });

export const reserveSchema = z
  .object({
    mode: z.enum(["percentage", "litres"]).default("percentage"),
    value: z.number().finite().positive().default(15),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "percentage" && (data.value <= 0 || data.value >= 100)) {
      ctx.addIssue({
        code: "custom",
        message: "Réserve en % entre 0 et 100 (exclus)",
        path: ["value"],
      });
    }
  });

/**
 * Options du calcul de plan carburant (voyage).
 * Compat : defaultPricePerLiter / consumptionL100 conservés.
 */
export const fuelEstimateSchema = z.object({
  defaultPricePerLiter: optionalPositiveNumber,
  consumptionL100: optionalPositiveNumber,
  tankCapacityL: optionalPositiveNumber,
  fuelType: tripFuelTypeSchema.optional(),
  includeReturnTrip: z.boolean().optional().default(true),
  returnDistanceKm: optionalPositiveNumber,
  initialFuel: initialFuelSchema.optional().default({ mode: "full" }),
  departureRefill: departureRefillSchema.optional().default({ mode: "none" }),
  includeExistingFuelValue: z.boolean().optional().default(false),
  refillStrategy: z
    .enum(["full_tank", "required_only", "optimized"])
    .optional()
    .default("full_tank"),
  reserve: reserveSchema.optional(),
  refillAtDestination: z.boolean().optional().default(false),
  finishWithFullTank: z.boolean().optional().default(false),
});

export type FuelLogCreateInput = z.infer<typeof fuelLogCreateSchema>;
export type FuelLogUpdateInput = z.infer<typeof fuelLogUpdateSchema>;
export type FuelEstimateInput = z.infer<typeof fuelEstimateSchema>;
export type TripFuelType = z.infer<typeof tripFuelTypeSchema>;
