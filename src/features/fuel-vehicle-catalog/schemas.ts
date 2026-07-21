import { z } from "zod";

export const yearQuerySchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(1995)
    .max(new Date().getFullYear() + 2),
});

export const makesQuerySchema = yearQuerySchema;

export const modelsQuerySchema = yearQuerySchema.extend({
  make: z.string().trim().min(1).max(150),
});

export const configurationsQuerySchema = modelsQuerySchema.extend({
  model: z.string().trim().min(1).max(200),
});

export const catalogIdParamSchema = z.object({
  id: z.string().uuid({ error: "Identifiant invalide" }),
});
