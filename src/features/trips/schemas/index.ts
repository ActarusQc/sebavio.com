import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  STOP_DIRECTIONS,
  STOP_TYPES,
  TRIP_STATUSES,
} from "@/features/trips/constants";

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

const optionalDateTime = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  return v;
}, z.coerce.date().nullable().optional());

const requiredDateTime = z.coerce.date({
  error: "Date invalide",
});

function refineReturnAfterDeparture(
  data: { departureDate?: Date; returnDate?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (
    data.departureDate &&
    data.returnDate &&
    data.returnDate.getTime() < data.departureDate.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      message: "La date de retour doit être postérieure ou égale au départ",
      path: ["returnDate"],
    });
  }
}

function refineStopTimes(
  data: { arrivalTime?: Date | null; departureTime?: Date | null },
  ctx: z.RefinementCtx,
) {
  if (
    data.arrivalTime &&
    data.departureTime &&
    data.departureTime.getTime() < data.arrivalTime.getTime()
  ) {
    ctx.addIssue({
      code: "custom",
      message:
        "L'heure de départ de l'étape doit être postérieure ou égale à l'arrivée",
      path: ["departureTime"],
    });
  }
}

export const tripsListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  status: z.enum(TRIP_STATUSES).optional(),
  vehicleId: z.string().uuid({ error: "Identifiant invalide" }).optional(),
});

const optionalPlaceId = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const optionalCoord = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nullable().optional());

const optionalPlacePart = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

const tripPlaceFields = {
  originPlaceId: optionalPlaceId,
  originLatitude: optionalCoord,
  originLongitude: optionalCoord,
  originCity: optionalPlacePart(120),
  originProvince: optionalPlacePart(120),
  originPostalCode: optionalPlacePart(20),
  originCountry: optionalPlacePart(2),
  destinationPlaceId: optionalPlaceId,
  destinationLatitude: optionalCoord,
  destinationLongitude: optionalCoord,
  destinationCity: optionalPlacePart(120),
  destinationProvince: optionalPlacePart(120),
  destinationPostalCode: optionalPlacePart(20),
  destinationCountry: optionalPlacePart(2),
};

function refineGooglePlaceComplete(
  data: {
    originPlaceId?: string | null;
    originLatitude?: number | null;
    originLongitude?: number | null;
    destinationPlaceId?: string | null;
    destinationLatitude?: number | null;
    destinationLongitude?: number | null;
  },
  ctx: z.RefinementCtx,
) {
  if (
    data.originPlaceId &&
    (data.originLatitude == null || data.originLongitude == null)
  ) {
    ctx.addIssue({
      code: "custom",
      message:
        "Adresse de départ Google incomplète. Resélectionnez une suggestion.",
      path: ["origin"],
    });
  }
  if (
    data.destinationPlaceId &&
    (data.destinationLatitude == null || data.destinationLongitude == null)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Destination Google incomplète. Resélectionnez une suggestion.",
      path: ["destination"],
    });
  }
}

export const tripCreateSchema = z
  .object({
    vehicleId: z.string().uuid({ error: "Véhicule invalide" }),
    travelGroupId: z
      .string()
      .uuid({ error: "Groupe invalide" })
      .nullable()
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, { error: "Titre requis" })
      .max(150, { error: "Titre trop long" }),
    origin: z
      .string()
      .trim()
      .min(1, { error: "Point de départ requis" })
      .max(2000),
    destination: z
      .string()
      .trim()
      .min(1, { error: "Destination requise" })
      .max(2000),
    ...tripPlaceFields,
    departureDate: requiredDateTime,
    returnDate: optionalDateTime,
    plannedBudget: optionalDecimal,
  })
  .superRefine(refineReturnAfterDeparture)
  .superRefine(refineGooglePlaceComplete);

export const tripUpdateSchema = z
  .object({
    vehicleId: z.string().uuid({ error: "Véhicule invalide" }).optional(),
    travelGroupId: z
      .string()
      .uuid({ error: "Groupe invalide" })
      .nullable()
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, { error: "Titre requis" })
      .max(150)
      .optional(),
    origin: z.string().trim().min(1).max(2000).optional(),
    destination: z.string().trim().min(1).max(2000).optional(),
    ...tripPlaceFields,
    departureDate: z.coerce.date().optional(),
    returnDate: optionalDateTime,
    plannedBudget: optionalDecimal,
    status: z.enum(["planned", "in_progress"]).optional(),
  })
  .superRefine(refineReturnAfterDeparture)
  .superRefine(refineGooglePlaceComplete);

/** Coordonnées d'étape : longitudes Ouest (ex. Québec −71) et latitudes Sud autorisées. */
const optionalStopCoord = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string") return Number(v);
  return v;
}, z.number().finite().nullable().optional());

export const stopCreateSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Nom d'étape requis" }).max(200),
    address: optionalString(2000),
    latitude: optionalStopCoord,
    longitude: optionalStopCoord,
    arrivalTime: optionalDateTime,
    departureTime: optionalDateTime,
    stopType: z.enum(STOP_TYPES).default("detour"),
    direction: z.enum(STOP_DIRECTIONS).default("outbound"),
    placeId: optionalPlaceId,
    durationMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .default(0),
    notes: optionalString(2000),
    sequence: z.coerce.number().int().positive().optional(),
    /** Dupliquer aussi sur le trajet retour (même lieu). */
    alsoAddToReturn: z.boolean().optional().default(false),
  })
  .superRefine(refineStopTimes);

export const stopUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    address: optionalString(2000),
    latitude: optionalStopCoord,
    longitude: optionalStopCoord,
    arrivalTime: optionalDateTime,
    departureTime: optionalDateTime,
    stopType: z.enum(STOP_TYPES).optional(),
    direction: z.enum(STOP_DIRECTIONS).optional(),
    placeId: optionalPlaceId,
    durationMinutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .optional(),
    notes: optionalString(2000),
    sequence: z.coerce.number().int().positive().optional(),
  })
  .superRefine(refineStopTimes);

export const stopReorderSchema = z.object({
  direction: z.enum(STOP_DIRECTIONS),
  orderedIds: z
    .array(z.string().uuid({ error: "Identifiant invalide" }))
    .min(1),
});

export type StopReorderInput = z.infer<typeof stopReorderSchema>;

export type TripCreateInput = z.infer<typeof tripCreateSchema>;
export type TripUpdateInput = z.infer<typeof tripUpdateSchema>;
export type StopCreateInput = z.infer<typeof stopCreateSchema>;
export type StopUpdateInput = z.infer<typeof stopUpdateSchema>;
