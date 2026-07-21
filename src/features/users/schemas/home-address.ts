import { z } from "zod";

export const homeAddressSchema = z
  .object({
    homeAddressLabel: z.string().trim().min(1).max(2000),
    homeAddressPlaceId: z.string().trim().min(1).max(255),
    homeAddressLatitude: z.number().finite(),
    homeAddressLongitude: z.number().finite(),
    homeAddressCity: z.string().trim().max(120).nullable().optional(),
    homeAddressProvince: z.string().trim().max(120).nullable().optional(),
    homeAddressPostalCode: z.string().trim().max(20).nullable().optional(),
    homeAddressCountry: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/)
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.homeAddressLatitude < -90 ||
      data.homeAddressLatitude > 90 ||
      data.homeAddressLongitude < -180 ||
      data.homeAddressLongitude > 180
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Coordonnées de domicile invalides",
        path: ["homeAddressLatitude"],
      });
    }
  });

export type HomeAddressInput = z.infer<typeof homeAddressSchema>;
