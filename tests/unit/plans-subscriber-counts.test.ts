import { beforeEach, describe, expect, it, vi } from "vitest";

const { planFindUnique, subscriptionFindMany } = vi.hoisted(() => ({
  planFindUnique: vi.fn(),
  subscriptionFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findUnique: planFindUnique },
    stripeSubscription: { findMany: subscriptionFindMany },
  },
}));

import { countSubscribersForPlan } from "@/features/plans/lib/subscriber-counts";

const PLAN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

type PlanRow = {
  id: string;
  status: string;
  stripeMode: string;
  stripeProductId: string | null;
  prices: Array<{
    stripePriceId: string;
    interval: string;
    intervalCount: number;
    unitAmount: number;
    status: string;
  }>;
};

/**
 * Champs StripeSubscription utilisés (projection mono-item Phase 3) :
 * pas d'intervalCount local — fourni via PlanPrice.stripePriceId.
 */
type SubRow = {
  status: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
  unitAmount: number | null;
  billingInterval: string | null;
  quantity: number;
  stripeMode: string;
};

function planFixture(overrides: Partial<PlanRow> = {}): PlanRow {
  return {
    id: PLAN_ID,
    status: "active",
    stripeMode: "test",
    stripeProductId: "prod_plan",
    prices: [
      {
        stripePriceId: "price_month",
        interval: "month",
        intervalCount: 1,
        unitAmount: 1000,
        status: "active",
      },
      {
        stripePriceId: "price_year",
        interval: "year",
        intervalCount: 1,
        unitAmount: 10000,
        status: "active",
      },
    ],
    ...overrides,
  };
}

function sub(overrides: Partial<SubRow> = {}): SubRow {
  return {
    status: "active",
    stripePriceId: "price_month",
    stripeProductId: "prod_plan",
    unitAmount: 1000,
    billingInterval: "month",
    quantity: 1,
    stripeMode: "test",
    ...overrides,
  };
}

describe("countSubscribersForPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionFindMany.mockResolvedValue([]);
  });

  it("lève une erreur si le plan est introuvable", async () => {
    planFindUnique.mockResolvedValue(null);
    await expect(countSubscribersForPlan(PLAN_ID)).rejects.toThrow(
      /forfait introuvable/i,
    );
    expect(subscriptionFindMany).not.toHaveBeenCalled();
  });

  it("retourne zéro pour pending_reconciliation sans produit ni prix", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        status: "pending_reconciliation",
        stripeProductId: null,
        prices: [],
      }),
    );
    await expect(countSubscribersForPlan(PLAN_ID)).resolves.toEqual({
      active: 0,
      canceled: 0,
      estimatedMonthlyRevenueCents: 0,
      revenueIsComplete: true,
    });
    expect(subscriptionFindMany).not.toHaveBeenCalled();
  });

  it("filtre stripeMode et construit OR price + product fallback", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([]);

    await countSubscribersForPlan(PLAN_ID);

    expect(subscriptionFindMany).toHaveBeenCalledTimes(1);
    const arg = subscriptionFindMany.mock.calls[0]?.[0] as {
      where: {
        stripeMode: string;
        OR: unknown[];
      };
      select: Record<string, boolean>;
    };
    expect(arg.where.stripeMode).toBe("test");
    expect(arg.where.OR).toEqual([
      { stripePriceId: { in: ["price_month", "price_year"] } },
      { stripePriceId: null, stripeProductId: "prod_plan" },
    ]);
    expect(arg.select).toMatchObject({
      status: true,
      stripePriceId: true,
      unitAmount: true,
      billingInterval: true,
      quantity: true,
    });
  });

  it("correspondance prioritaire par stripePriceId", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({ stripePriceId: "price_month", status: "active" }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(1);
    expect(result.canceled).toBe(0);
  });

  it("fallback produit seulement si stripePriceId est null", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: null,
        stripeProductId: "prod_plan",
        unitAmount: 1000,
        billingInterval: "month",
      }),
    ]);
    // Product fallback cannot resolve intervalCount from PlanPrice → incomplete revenue
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(1);
    expect(result.estimatedMonthlyRevenueCents).toBeNull();
    expect(result.revenueIsComplete).toBe(false);
  });

  it("compte active, trialing et past_due comme actifs", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({ status: "active" }),
      sub({ status: "trialing" }),
      sub({ status: "past_due" }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(3);
  });

  it("compte canceled séparément", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({ status: "active" }),
      sub({ status: "canceled" }),
      sub({ status: "canceled" }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(1);
    expect(result.canceled).toBe(2);
  });

  it("exclut les autres statuts des deux compteurs", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({ status: "incomplete" }),
      sub({ status: "unpaid" }),
      sub({ status: "paused" }),
      sub({ status: "incomplete_expired" }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(0);
    expect(result.canceled).toBe(0);
    expect(result.estimatedMonthlyRevenueCents).toBe(0);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("compte toujours un forfait hidden", async () => {
    planFindUnique.mockResolvedValue(planFixture({ status: "hidden" }));
    subscriptionFindMany.mockResolvedValue([sub()]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(1);
  });

  it("compte toujours un forfait archived", async () => {
    planFindUnique.mockResolvedValue(planFixture({ status: "archived" }));
    subscriptionFindMany.mockResolvedValue([sub()]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(1);
  });

  it("utilise les anciens PlanPrice archivés pour l'association", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        prices: [
          {
            stripePriceId: "price_old",
            interval: "month",
            intervalCount: 1,
            unitAmount: 800,
            status: "archived",
          },
        ],
      }),
    );
    await countSubscribersForPlan(PLAN_ID);
    const arg = subscriptionFindMany.mock.calls[0]?.[0] as {
      where: { OR: Array<{ stripePriceId?: { in: string[] } }> };
    };
    expect(arg.where.OR[0]?.stripePriceId).toEqual({ in: ["price_old"] });
  });

  it("plan sans produit ni prix retourne zéro sans requête abonnements", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({ stripeProductId: null, prices: [] }),
    );
    await expect(countSubscribersForPlan(PLAN_ID)).resolves.toEqual({
      active: 0,
      canceled: 0,
      estimatedMonthlyRevenueCents: 0,
      revenueIsComplete: true,
    });
    expect(subscriptionFindMany).not.toHaveBeenCalled();
  });

  it("calcule le revenu mensuel pour intervalle month", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_month",
        unitAmount: 1999,
        billingInterval: "month",
        quantity: 1,
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBe(1999);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("calcule le revenu mensuel pour month avec intervalCount > 1", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        prices: [
          {
            stripePriceId: "price_q",
            interval: "month",
            intervalCount: 3,
            unitAmount: 3000,
            status: "active",
          },
        ],
      }),
    );
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_q",
        unitAmount: 3000,
        billingInterval: "month",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBe(1000);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("calcule le revenu mensuel pour year", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_year",
        unitAmount: 12000,
        billingInterval: "year",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBe(1000);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("calcule le revenu mensuel pour year avec intervalCount > 1", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        prices: [
          {
            stripePriceId: "price_2y",
            interval: "year",
            intervalCount: 2,
            unitAmount: 24000,
            status: "active",
          },
        ],
      }),
    );
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_2y",
        unitAmount: 24000,
        billingInterval: "year",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBe(1000);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("applique la quantité (quantity)", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_month",
        unitAmount: 1000,
        billingInterval: "month",
        quantity: 3,
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBe(3000);
  });

  it("estimation null si champ financier manquant", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_month",
        unitAmount: null,
        billingInterval: "month",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBeNull();
    expect(result.revenueIsComplete).toBe(false);
  });

  it("estimation null pour intervalle day/week", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        prices: [
          {
            stripePriceId: "price_week",
            interval: "week",
            intervalCount: 1,
            unitAmount: 500,
            status: "active",
          },
        ],
      }),
    );
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_week",
        unitAmount: 500,
        billingInterval: "week",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.estimatedMonthlyRevenueCents).toBeNull();
    expect(result.revenueIsComplete).toBe(false);
  });

  it("aucun abonnement actif → estimation 0 complète", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([sub({ status: "canceled" })]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(0);
    expect(result.canceled).toBe(1);
    expect(result.estimatedMonthlyRevenueCents).toBe(0);
    expect(result.revenueIsComplete).toBe(true);
  });

  it("si un actif est incomplet, tout le revenu est null", async () => {
    planFindUnique.mockResolvedValue(planFixture());
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_month",
        unitAmount: 1000,
        billingInterval: "month",
      }),
      sub({
        stripePriceId: null,
        stripeProductId: "prod_plan",
        unitAmount: 1000,
        billingInterval: "month",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    expect(result.active).toBe(2);
    expect(result.estimatedMonthlyRevenueCents).toBeNull();
    expect(result.revenueIsComplete).toBe(false);
  });

  it("OR sans branche product si stripeProductId null", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        stripeProductId: null,
        prices: [
          {
            stripePriceId: "price_only",
            interval: "month",
            intervalCount: 1,
            unitAmount: 500,
            status: "active",
          },
        ],
      }),
    );
    await countSubscribersForPlan(PLAN_ID);
    const arg = subscriptionFindMany.mock.calls[0]?.[0] as {
      where: { OR: unknown[] };
    };
    expect(arg.where.OR).toEqual([{ stripePriceId: { in: ["price_only"] } }]);
  });

  it("arrondit seulement le total final", async () => {
    planFindUnique.mockResolvedValue(
      planFixture({
        prices: [
          {
            stripePriceId: "price_odd",
            interval: "month",
            intervalCount: 3,
            unitAmount: 1000,
            status: "active",
          },
        ],
      }),
    );
    subscriptionFindMany.mockResolvedValue([
      sub({
        stripePriceId: "price_odd",
        unitAmount: 1000,
        billingInterval: "month",
      }),
    ]);
    const result = await countSubscribersForPlan(PLAN_ID);
    // 1000 / 3 = 333.333… → Math.round
    expect(result.estimatedMonthlyRevenueCents).toBe(333);
  });
});
