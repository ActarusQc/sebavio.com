import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planFindFirst,
  planPurchaseCount,
  planAccessGrantCount,
  planAccessGrantFindMany,
  stripeSubscriptionFindMany,
  planEntitlementDeleteMany,
  planPriceDeleteMany,
  planDelete,
  prismaTransaction,
  getStripeMode,
  deactivateStripePrice,
  archiveStripeProduct,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planFindFirst: vi.fn(),
  planPurchaseCount: vi.fn(),
  planAccessGrantCount: vi.fn(),
  planAccessGrantFindMany: vi.fn(),
  stripeSubscriptionFindMany: vi.fn(),
  planEntitlementDeleteMany: vi.fn(),
  planPriceDeleteMany: vi.fn(),
  planDelete: vi.fn(),
  prismaTransaction: vi.fn(),
  getStripeMode: vi.fn(),
  deactivateStripePrice: vi.fn(),
  archiveStripeProduct: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findFirst: planFindFirst, delete: planDelete },
    planPurchase: { count: planPurchaseCount },
    planAccessGrant: {
      count: planAccessGrantCount,
      findMany: planAccessGrantFindMany,
    },
    stripeSubscription: { findMany: stripeSubscriptionFindMany },
    planEntitlement: { deleteMany: planEntitlementDeleteMany },
    planPrice: { deleteMany: planPriceDeleteMany },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/price-service", () => ({
  deactivateStripePrice,
}));
vi.mock("@/services/stripe/product-service", () => ({
  archiveStripeProduct,
}));
vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  canHardDeletePlan,
  deletePlanHard,
} from "@/features/plans/services/plan-delete";

const PLAN_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR = {
  id: "22222222-2222-4222-8222-222222222222",
  role: "admin" as const,
};

function basePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: PLAN_ID,
    publicName: "Smoke test plan",
    internalName: "smoke-test",
    status: "active",
    isSystemProtected: false,
    stripeProductId: "prod_test",
    stripeMode: "test",
    prices: [
      {
        id: "price-local",
        stripePriceId: "price_test",
        billingType: "one_time",
        interval: "one_time",
        intervalCount: 1,
        unitAmount: 100,
        currency: "cad",
        isCurrent: true,
        accessDurationDays: 30,
      },
    ],
    ...overrides,
  };
}

describe("plan-delete — canHardDeletePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    planAccessGrantFindMany.mockResolvedValue([]);
  });

  it("refuse si des achats existent", async () => {
    planFindFirst.mockResolvedValue(basePlan());
    planPurchaseCount.mockResolvedValue(2);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    expect(await canHardDeletePlan(PLAN_ID)).toBe(false);
  });

  it("refuse si des grants existent", async () => {
    planFindFirst.mockResolvedValue(basePlan());
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(1);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    expect(await canHardDeletePlan(PLAN_ID)).toBe(false);
  });

  it("refuse si des abonnements existent", async () => {
    planFindFirst.mockResolvedValue(basePlan());
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([
      { userId: "u1", status: "canceled" },
    ]);

    expect(await canHardDeletePlan(PLAN_ID)).toBe(false);
  });

  it("refuse un forfait système sans confirmSystemDelete", async () => {
    planFindFirst.mockResolvedValue(
      basePlan({ isSystemProtected: true, publicName: "Pass 30 jours" }),
    );
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    expect(await canHardDeletePlan(PLAN_ID)).toBe(false);
    expect(
      await canHardDeletePlan(PLAN_ID, {
        confirmSystemDelete: true,
        confirmPublicName: "Pass 30 jours",
      }),
    ).toBe(true);
  });

  it("refuse si confirmPublicName ne correspond pas (système)", async () => {
    planFindFirst.mockResolvedValue(
      basePlan({ isSystemProtected: true, publicName: "Pass 30 jours" }),
    );
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    expect(
      await canHardDeletePlan(PLAN_ID, {
        confirmSystemDelete: true,
        confirmPublicName: "Mauvais nom",
      }),
    ).toBe(false);
  });
});

describe("plan-delete — deletePlanHard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    planAccessGrantFindMany.mockResolvedValue([]);
    writeAdminAuditLog.mockResolvedValue(undefined);
    deactivateStripePrice.mockResolvedValue({});
    archiveStripeProduct.mockResolvedValue({});
    prismaTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        planEntitlement: { deleteMany: planEntitlementDeleteMany },
        planPrice: { deleteMany: planPriceDeleteMany },
        plan: { delete: planDelete },
      }),
    );
    planEntitlementDeleteMany.mockResolvedValue({ count: 0 });
    planPriceDeleteMany.mockResolvedValue({ count: 1 });
    planDelete.mockResolvedValue({});
  });

  it("refuse si confirmPublicName ne correspond pas", async () => {
    planFindFirst.mockResolvedValue(basePlan());
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    await expect(
      deletePlanHard(
        {
          planId: PLAN_ID,
          confirmPublicName: "Autre nom",
        },
        ACTOR,
      ),
    ).rejects.toThrow(/ne correspond pas/i);
  });

  it("refuse un forfait système sans confirmSystemDelete", async () => {
    planFindFirst.mockResolvedValue(
      basePlan({ isSystemProtected: true, publicName: "Découverte" }),
    );
    planPurchaseCount.mockResolvedValue(0);
    planAccessGrantCount.mockResolvedValue(0);
    stripeSubscriptionFindMany.mockResolvedValue([]);

    await expect(
      deletePlanHard(
        {
          planId: PLAN_ID,
          confirmPublicName: "Découverte",
        },
        ACTOR,
      ),
    ).rejects.toThrow(/système/i);
  });
});
