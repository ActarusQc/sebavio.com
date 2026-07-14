import { z } from "zod";

const optionalPositiveNumber = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().positive().nullable().optional());

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

export const fuelEstimateSchema = z.object({
  defaultPricePerLiter: optionalPositiveNumber,
  /** Override consommation L/100 (sinon real_avg ou catalogue). */
  consumptionL100: optionalPositiveNumber,
});

export type FuelLogCreateInput = z.infer<typeof fuelLogCreateSchema>;
export type FuelLogUpdateInput = z.infer<typeof fuelLogUpdateSchema>;
export type FuelEstimateInput = z.infer<typeof fuelEstimateSchema>;
