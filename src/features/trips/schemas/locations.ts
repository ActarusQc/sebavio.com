import { z } from "zod";

const finiteNumber = z.number().finite();

export const tripLocationPointSchema = z.object({
  clientPointId: z.string().uuid({ error: "Identifiant point invalide" }),
  latitude: finiteNumber.min(-90).max(90),
  longitude: finiteNumber.min(-180).max(180),
  accuracyM: finiteNumber.nonnegative().nullable().optional(),
  heading: finiteNumber.min(0).lt(360).nullable().optional(),
  speedMps: finiteNumber.nonnegative().nullable().optional(),
  recordedAt: z.coerce.date({ error: "Horodatage invalide" }),
});

export const tripLocationsPostSchema = z.object({
  points: z
    .array(tripLocationPointSchema)
    .min(1, { error: "Au moins un point requis" })
    .max(50, { error: "Maximum 50 points par requête" }),
});

export const tripLocationsListQuerySchema = z.object({
  since: z.coerce.date().optional(),
  limit: z.coerce.number().int().positive().max(2000).default(500),
});

export type TripLocationPointInput = z.infer<typeof tripLocationPointSchema>;
export type TripLocationsPostInput = z.infer<typeof tripLocationsPostSchema>;
export type TripLocationsListQuery = z.infer<
  typeof tripLocationsListQuerySchema
>;
