/**
 * Schémas Zod — entrées admin Forfaits (Phase 4).
 * stripeMode / ids Stripe / status : contrôlés serveur uniquement.
 * setEntitlementsSchema : liste partielle OK (upsert ciblé futur).
 * applyPlanSyncSchema.actionType : resserré en union discriminée à la Task 7.
 */

import { z } from "zod";

import { PLAN_ENTITLEMENT_KEYS } from "@/features/plans/lib/entitlement-registry";

const planEntitlementKeySchema = z.enum(PLAN_ENTITLEMENT_KEYS);

export const uuidSchema = z.string().uuid();

export const unitAmountSchema = z.number().int().min(0);

export const currencySchema = z
  .string()
  .trim()
  .min(1)
  .transform((v) => v.toLowerCase())
  .pipe(z.string().regex(/^[a-z]{3}$/));

export const billingIntervalSchema = z.enum(["day", "week", "month", "year"]);

export const intervalCountSchema = z.number().int().positive();

export const internalNameSchema = z
  .string()
  .trim()
  .transform((v) => v.toLowerCase())
  .pipe(
    z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-z0-9_-]+$/, "Identifiant interne invalide (slug)."),
  );

const emptyToNull = (v: string) => {
  const t = v.trim();
  return t.length === 0 ? null : t;
};

export const optionalDescriptionSchema = z
  .string()
  .transform(emptyToNull)
  .pipe(z.string().max(500).nullable())
  .optional();

export const optionalFullDescriptionSchema = z
  .string()
  .transform(emptyToNull)
  .pipe(z.string().nullable())
  .optional();

export const adminReasonSchema = z
  .string()
  .trim()
  .min(1, "La raison est obligatoire.")
  .max(500);

export const planEntitlementInputSchema = z
  .object({
    key: planEntitlementKeySchema,
    enabled: z.boolean(),
    limit: z.number().int().min(0).nullable(),
    value: z.string().max(255).nullable(),
  })
  .strict();

function assertUniqueEntitlementKeys(
  entitlements: Array<{ key: string }>,
  ctx: z.RefinementCtx,
) {
  const seen = new Set<string>();
  for (const e of entitlements) {
    if (seen.has(e.key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Clé d'entitlement en double : ${e.key}`,
      });
      return;
    }
    seen.add(e.key);
  }
}

const createPlanPriceItemSchema = z
  .object({
    unitAmount: unitAmountSchema,
    currency: currencySchema.default("cad"),
    interval: billingIntervalSchema,
    intervalCount: intervalCountSchema,
  })
  .strict();

export const createPlanSchema = z
  .object({
    internalName: internalNameSchema,
    publicName: z.string().trim().min(1).max(150),
    shortDescription: z
      .string()
      .transform(emptyToNull)
      .pipe(z.string().max(500).nullable())
      .optional(),
    fullDescription: z
      .string()
      .transform(emptyToNull)
      .pipe(z.string().nullable())
      .optional(),
    displayOrder: z.number().int().min(0).default(0),
    isFeatured: z.boolean().default(false),
    isVisibleOnSignup: z.boolean().default(true),
    defaultTrialDays: z.number().int().min(0).nullable().optional(),
    prices: z.array(createPlanPriceItemSchema).min(1),
    entitlements: z.array(planEntitlementInputSchema).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const combos = new Set<string>();
    for (const price of data.prices) {
      const key = `${price.interval}:${price.intervalCount}:${price.currency}`;
      if (combos.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Combinaison intervalle / intervalCount / devise en double.",
          path: ["prices"],
        });
        return;
      }
      combos.add(key);
    }
    if (data.entitlements) {
      assertUniqueEntitlementKeys(data.entitlements, ctx);
    }
  });

export const updatePlanMetadataSchema = z
  .object({
    planId: uuidSchema,
    publicName: z.string().trim().min(1).max(150),
    shortDescription: z
      .string()
      .transform(emptyToNull)
      .pipe(z.string().max(500).nullable())
      .optional(),
    fullDescription: z
      .string()
      .transform(emptyToNull)
      .pipe(z.string().nullable())
      .optional(),
    displayOrder: z.number().int().min(0),
    isFeatured: z.boolean(),
    isVisibleOnSignup: z.boolean(),
    defaultTrialDays: z.number().int().min(0).nullable().optional(),
  })
  .strict();

export const setEntitlementsSchema = z
  .object({
    planId: uuidSchema,
    entitlements: z.array(planEntitlementInputSchema),
  })
  .strict()
  .superRefine((data, ctx) => {
    assertUniqueEntitlementKeys(data.entitlements, ctx);
  });

/** Spécification tarifaire (création forfait / réconciliation) — sans operationId. */
export const planPriceSpecSchema = z
  .object({
    unitAmount: unitAmountSchema,
    currency: currencySchema.default("cad"),
    interval: billingIntervalSchema,
    intervalCount: intervalCountSchema.default(1),
  })
  .strict();

export const createPlanPriceSchema = z
  .object({
    planId: uuidSchema,
    unitAmount: unitAmountSchema,
    currency: currencySchema.default("cad"),
    interval: billingIntervalSchema,
    intervalCount: intervalCountSchema.default(1),
    archivePreviousForNewSubscribers: z.boolean().default(false),
    /// Identifiant stable de l'opération tarifaire (UUID) — fourni par l'appelant
    operationId: uuidSchema,
  })
  .strict();

export const archivePlanSchema = z
  .object({
    planId: uuidSchema,
    reason: adminReasonSchema,
    archiveStripeProduct: z.boolean(),
  })
  .strict();

export const hidePlanSchema = z
  .object({
    planId: uuidSchema,
    reason: adminReasonSchema,
  })
  .strict();

const syncActionSchema = z
  .object({
    actionKey: z.string().trim().min(1).max(255),
    actionType: z.string().min(1),
    payload: z.unknown().optional(),
  })
  .strict();

export const applyPlanSyncSchema = z
  .object({
    syncRunId: uuidSchema,
    confirmedActions: z.array(syncActionSchema),
  })
  .strict()
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (const action of data.confirmedActions) {
      if (seen.has(action.actionKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `actionKey en double : ${action.actionKey}`,
          path: ["confirmedActions"],
        });
        return;
      }
      seen.add(action.actionKey);
    }
  });

export const planStatusFilterSchema = z.enum([
  "active",
  "hidden",
  "archived",
  "pending_reconciliation",
]);

/** Filtres liste — le mode Stripe est toujours celui du serveur (jamais client). */
export const listPlansSchema = z
  .object({
    status: planStatusFilterSchema.optional(),
  })
  .strict();

export const getPlanSchema = z
  .object({
    planId: uuidSchema,
  })
  .strict();

export const duplicatePlanSchema = z
  .object({
    planId: uuidSchema,
    internalName: internalNameSchema,
  })
  .strict();

export const reconcilePlanSchema = z
  .object({
    planId: uuidSchema,
    prices: z.array(planPriceSpecSchema).optional(),
  })
  .strict();

export const deletePlanSchema = z
  .object({
    planId: uuidSchema,
    confirmPublicName: z.string().trim().min(1),
    confirmSystemDelete: z.boolean().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanMetadataInput = z.infer<typeof updatePlanMetadataSchema>;
export type SetEntitlementsInput = z.infer<typeof setEntitlementsSchema>;
export type CreatePlanPriceInput = z.infer<typeof createPlanPriceSchema>;
export type ArchivePlanInput = z.infer<typeof archivePlanSchema>;
export type HidePlanInput = z.infer<typeof hidePlanSchema>;
export type ApplyPlanSyncInput = z.infer<typeof applyPlanSyncSchema>;
export type ListPlansInput = z.infer<typeof listPlansSchema>;
export type GetPlanInput = z.infer<typeof getPlanSchema>;
export type DuplicatePlanInput = z.infer<typeof duplicatePlanSchema>;
export type ReconcilePlanInput = z.infer<typeof reconcilePlanSchema>;
export type DeletePlanInput = z.infer<typeof deletePlanSchema>;
