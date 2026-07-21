import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas";
import { currencyForCountry } from "@/features/users/services/defaults";

const isoLanguage = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2}$/, { error: "Code langue invalide (ISO 639-1)" });

const isoCountry = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, { error: "Code pays invalide (ISO 3166-1)" });

const isoCurrency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, { error: "Code devise invalide (ISO 4217)" });

export const updateProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .max(100, { error: "Prénom trop long" })
      .optional(),
    lastName: z.string().trim().max(100, { error: "Nom trop long" }).optional(),
    language: isoLanguage.optional(),
    country: isoCountry.optional(),
    currency: isoCurrency.optional(),
    timezone: z
      .string()
      .trim()
      .min(1, { error: "Fuseau horaire requis" })
      .max(100)
      .optional(),
    travelStyle: z
      .string()
      .trim()
      .max(50)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
    budgetLevel: z
      .string()
      .trim()
      .max(30)
      .nullable()
      .optional()
      .transform((v) => (v === "" ? null : v)),
  })
  .refine((data) => Object.keys(data).length > 0, {
    error: "Aucun champ à mettre à jour",
  })
  .transform((data) => {
    if (data.country && !data.currency) {
      return { ...data, currency: currencyForCountry(data.country) };
    }
    return data;
  });

export const updatePreferencesSchema = z.object({
  distanceUnit: z.enum(["km", "miles"], {
    error: "Unité de distance invalide",
  }),
  temperatureUnit: z.enum(["C", "F"], {
    error: "Unité de température invalide",
  }),
  fuelUnit: z.enum(["L/100", "MPG"], {
    error: "Unité de carburant invalide",
  }),
  notificationsEnabled: z.boolean(),
  aiProactive: z.boolean(),
  costcoMember: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Mot de passe actuel requis" }),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { error: "Confirmation du mot de passe requise" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
