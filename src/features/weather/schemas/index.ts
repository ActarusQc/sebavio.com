import { z } from "zod";

const coord = z.coerce.number().finite();

export const weatherLocationQuerySchema = z.object({
  latitude: coord.refine((v) => v >= -90 && v <= 90, "latitude invalide"),
  longitude: coord.refine((v) => v >= -180 && v <= 180, "longitude invalide"),
});

export type WeatherLocationQuery = z.infer<typeof weatherLocationQuerySchema>;
