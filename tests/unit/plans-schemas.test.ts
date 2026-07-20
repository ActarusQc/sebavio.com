import { describe, expect, it } from "vitest";
import {
  applyPlanSyncSchema,
  archivePlanSchema,
  createPlanPriceSchema,
  createPlanSchema,
  hidePlanSchema,
  setEntitlementsSchema,
  updatePlanMetadataSchema,
} from "@/features/plans/lib/schemas";

const PLAN_ID = "11111111-1111-4111-8111-111111111111";
const SYNC_RUN_ID = "22222222-2222-4222-8222-222222222222";

const validCreateBase = {
  internalName: "premium",
  publicName: "Premium",
  prices: [
    {
      unitAmount: 1999,
      currency: "cad",
      interval: "month" as const,
      intervalCount: 1,
    },
    {
      unitAmount: 19999,
      currency: "cad",
      interval: "year" as const,
      intervalCount: 1,
    },
  ],
};

describe("createPlanSchema", () => {
  it("accepte une création valide avec prix mensuel et annuel", () => {
    const parsed = createPlanSchema.parse(validCreateBase);
    expect(parsed.internalName).toBe("premium");
    expect(parsed.publicName).toBe("Premium");
    expect(parsed.prices).toHaveLength(2);
    expect(parsed.displayOrder).toBe(0);
    expect(parsed.isFeatured).toBe(false);
    expect(parsed.isVisibleOnSignup).toBe(true);
  });

  it("applique currency = cad par défaut", () => {
    const parsed = createPlanSchema.parse({
      ...validCreateBase,
      prices: [
        {
          unitAmount: 1000,
          interval: "month",
          intervalCount: 1,
        },
      ],
    });
    expect(parsed.prices[0]?.currency).toBe("cad");
  });

  it("normalise CAD → cad", () => {
    const parsed = createPlanSchema.parse({
      ...validCreateBase,
      prices: [
        {
          unitAmount: 1000,
          currency: "CAD",
          interval: "month",
          intervalCount: 1,
        },
      ],
    });
    expect(parsed.prices[0]?.currency).toBe("cad");
  });

  it("rejette un montant négatif", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: -1,
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette un montant décimal", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: 10.5,
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepte un montant à zéro", () => {
    const parsed = createPlanSchema.parse({
      ...validCreateBase,
      prices: [
        {
          unitAmount: 0,
          currency: "cad",
          interval: "month",
          intervalCount: 1,
        },
      ],
    });
    expect(parsed.prices[0]?.unitAmount).toBe(0);
  });

  it("rejette une conversion implicite string → unitAmount", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: "1999",
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette un intervalCount nul", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: 1000,
            currency: "cad",
            interval: "month",
            intervalCount: 0,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette un intervalCount négatif", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: 1000,
            currency: "cad",
            interval: "month",
            intervalCount: -1,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette un intervalCount décimal", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: 1000,
            currency: "cad",
            interval: "month",
            intervalCount: 1.5,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette un nom interne contenant des espaces", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        internalName: "pre mium",
      }).success,
    ).toBe(false);
  });

  it("normalise le nom interne en minuscules", () => {
    const parsed = createPlanSchema.parse({
      ...validCreateBase,
      internalName: "Premium_Plan",
    });
    expect(parsed.internalName).toBe("premium_plan");
  });

  it("rejette une clé entitlement inconnue", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        entitlements: [
          {
            key: "unknown.feature",
            enabled: true,
            limit: null,
            value: null,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette deux entitlements portant la même clé", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        entitlements: [
          {
            key: "trips.max",
            enabled: true,
            limit: 5,
            value: null,
          },
          {
            key: "trips.max",
            enabled: false,
            limit: null,
            value: null,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejette deux prix portant la même combinaison intervalle/intervalCount/devise", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        prices: [
          {
            unitAmount: 1000,
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
          {
            unitAmount: 2000,
            currency: "cad",
            interval: "month",
            intervalCount: 1,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepte defaultTrialDays nul ou positif", () => {
    expect(
      createPlanSchema.parse({
        ...validCreateBase,
        defaultTrialDays: null,
      }).defaultTrialDays,
    ).toBeNull();
    expect(
      createPlanSchema.parse({
        ...validCreateBase,
        defaultTrialDays: 14,
      }).defaultTrialDays,
    ).toBe(14);
  });

  it("rejette un defaultTrialDays négatif", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        defaultTrialDays: -1,
      }).success,
    ).toBe(false);
  });

  it("normalise les descriptions vides en null", () => {
    const parsed = createPlanSchema.parse({
      ...validCreateBase,
      shortDescription: "   ",
      fullDescription: "",
    });
    expect(parsed.shortDescription).toBeNull();
    expect(parsed.fullDescription).toBeNull();
  });

  it("rejette les identifiants Stripe injectés (.strict)", () => {
    expect(
      createPlanSchema.safeParse({
        ...validCreateBase,
        stripeMode: "test",
        stripeProductId: "prod_x",
        stripePriceId: "price_x",
        status: "active",
        archivedAt: null,
        reconciliationError: null,
        isCurrent: true,
      }).success,
    ).toBe(false);
  });
});

describe("updatePlanMetadataSchema", () => {
  const validUpdate = {
    planId: PLAN_ID,
    publicName: "Nouveau nom",
    displayOrder: 1,
    isFeatured: true,
    isVisibleOnSignup: false,
  };

  it("accepte une mise à jour métadonnées valide", () => {
    const parsed = updatePlanMetadataSchema.parse(validUpdate);
    expect(parsed.planId).toBe(PLAN_ID);
    expect(parsed.publicName).toBe("Nouveau nom");
  });

  it("rejette internalName et ids Stripe (.strict)", () => {
    expect(
      updatePlanMetadataSchema.safeParse({
        ...validUpdate,
        internalName: "hack",
      }).success,
    ).toBe(false);
    expect(
      updatePlanMetadataSchema.safeParse({
        ...validUpdate,
        stripeProductId: "prod_x",
        status: "archived",
      }).success,
    ).toBe(false);
  });
});

describe("setEntitlementsSchema", () => {
  it("accepte une liste partielle d'entitlements (upsert ciblé futur)", () => {
    const parsed = setEntitlementsSchema.parse({
      planId: PLAN_ID,
      entitlements: [
        {
          key: "trips.max",
          enabled: true,
          limit: 10,
          value: null,
        },
      ],
    });
    expect(parsed.entitlements).toHaveLength(1);
  });

  it("rejette clé inconnue, doublons et coercion string→number", () => {
    expect(
      setEntitlementsSchema.safeParse({
        planId: PLAN_ID,
        entitlements: [
          {
            key: "nope",
            enabled: true,
            limit: null,
            value: null,
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      setEntitlementsSchema.safeParse({
        planId: PLAN_ID,
        entitlements: [
          {
            key: "trips.max",
            enabled: true,
            limit: null,
            value: null,
          },
          {
            key: "trips.max",
            enabled: false,
            limit: 1,
            value: null,
          },
        ],
      }).success,
    ).toBe(false);

    expect(
      setEntitlementsSchema.safeParse({
        planId: PLAN_ID,
        entitlements: [
          {
            key: "trips.max",
            enabled: true,
            limit: "5",
            value: null,
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("createPlanPriceSchema", () => {
  const OPERATION_ID = "33333333-3333-4333-8333-333333333333";

  it("applique les défauts currency/intervalCount/archivePrevious", () => {
    const parsed = createPlanPriceSchema.parse({
      planId: PLAN_ID,
      unitAmount: 2500,
      interval: "month",
      operationId: OPERATION_ID,
    });
    expect(parsed.currency).toBe("cad");
    expect(parsed.intervalCount).toBe(1);
    expect(parsed.archivePreviousForNewSubscribers).toBe(false);
    expect(parsed.operationId).toBe(OPERATION_ID);
  });

  it("exige un operationId UUID", () => {
    expect(
      createPlanPriceSchema.safeParse({
        planId: PLAN_ID,
        unitAmount: 2500,
        interval: "month",
      }).success,
    ).toBe(false);
    expect(
      createPlanPriceSchema.safeParse({
        planId: PLAN_ID,
        unitAmount: 2500,
        interval: "month",
        operationId: "bad",
      }).success,
    ).toBe(false);
  });

  it("rejette isCurrent depuis le client (.strict)", () => {
    expect(
      createPlanPriceSchema.safeParse({
        planId: PLAN_ID,
        unitAmount: 2500,
        interval: "month",
        operationId: OPERATION_ID,
        isCurrent: true,
      }).success,
    ).toBe(false);
  });
});

describe("archivePlanSchema / hidePlanSchema", () => {
  it("exige une raison d'archivage et archiveStripeProduct booléen", () => {
    expect(
      archivePlanSchema.safeParse({
        planId: PLAN_ID,
        reason: "",
        archiveStripeProduct: true,
      }).success,
    ).toBe(false);

    expect(
      archivePlanSchema.safeParse({
        planId: PLAN_ID,
        reason: "Fin de commercialisation",
        archiveStripeProduct: "true",
      }).success,
    ).toBe(false);

    const parsed = archivePlanSchema.parse({
      planId: PLAN_ID,
      reason: "Fin de commercialisation",
      archiveStripeProduct: false,
    });
    expect(parsed.archiveStripeProduct).toBe(false);
  });

  it("valide hidePlanSchema", () => {
    const parsed = hidePlanSchema.parse({
      planId: PLAN_ID,
      reason: "Temporairement retiré",
    });
    expect(parsed.reason).toBe("Temporairement retiré");
  });
});

describe("applyPlanSyncSchema", () => {
  it("accepte des actions distinctes (actionType libre jusqu'à Task 7)", () => {
    const parsed = applyPlanSyncSchema.parse({
      syncRunId: SYNC_RUN_ID,
      confirmedActions: [
        {
          actionKey: "import:prod_1",
          actionType: "sync_action",
          payload: { anyKey: "anyValue" },
        },
      ],
    });
    expect(parsed.confirmedActions).toHaveLength(1);
    expect(parsed.confirmedActions[0]?.actionType).toBe("sync_action");
  });

  it("rejette deux confirmedActions avec le même actionKey", () => {
    expect(
      applyPlanSyncSchema.safeParse({
        syncRunId: SYNC_RUN_ID,
        confirmedActions: [
          { actionKey: "a", actionType: "x" },
          { actionKey: "a", actionType: "y" },
        ],
      }).success,
    ).toBe(false);
  });
});
