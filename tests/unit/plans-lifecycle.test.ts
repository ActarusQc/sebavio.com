import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planFindUnique,
  planCreate,
  planUpdate,
  planEntitlementFindMany,
  planEntitlementUpsert,
  planEntitlementCreateMany,
  planPriceCreate,
  planPriceFindMany,
  prismaTransaction,
  archiveStripeProduct,
  createSebavioProduct,
  createSebavioPrice,
  getStripeMode,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planFindUnique: vi.fn(),
  planCreate: vi.fn(),
  planUpdate: vi.fn(),
  planEntitlementFindMany: vi.fn(),
  planEntitlementUpsert: vi.fn(),
  planEntitlementCreateMany: vi.fn(),
  planPriceCreate: vi.fn(),
  planPriceFindMany: vi.fn(),
  prismaTransaction: vi.fn(),
  archiveStripeProduct: vi.fn(),
  createSebavioProduct: vi.fn(),
  createSebavioPrice: vi.fn(),
  getStripeMode: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findUnique: planFindUnique,
      create: planCreate,
      update: planUpdate,
    },
    planEntitlement: {
      findMany: planEntitlementFindMany,
      upsert: planEntitlementUpsert,
      createMany: planEntitlementCreateMany,
    },
    planPrice: {
      create: planPriceCreate,
      findMany: planPriceFindMany,
    },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/product-service", () => ({
  createSebavioProduct,
  archiveStripeProduct,
  listSebavioProducts: vi.fn(),
  updateSebavioProductMetadata: vi.fn(),
}));
vi.mock("@/services/stripe/price-service", () => ({
  createSebavioPrice,
  listPricesForProduct: vi.fn(),
}));
vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  archivePlan,
  duplicatePlan,
  hidePlan,
  updatePlanMetadata,
} from "@/features/plans/services/plan-crud";
import { setPlanEntitlements } from "@/features/plans/services/plan-entitlements";

const PLAN_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";
const ACTOR = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "admin" as const,
};

function activePlan(overrides: Record<string, unknown> = {}) {
  return {
    id: PLAN_ID,
    status: "active",
    stripeMode: "test",
    stripeProductId: "prod_1",
    publicName: "Premium",
    shortDescription: "S",
    fullDescription: null,
    displayOrder: 1,
    isFeatured: false,
    isVisibleOnSignup: true,
    defaultTrialDays: null,
    internalName: "premium",
    entitlements: [{ key: "trips.max", enabled: true, limit: 5, value: null }],
    prices: [
      {
        unitAmount: 1999,
        currency: "cad",
        interval: "month",
        intervalCount: 1,
        isCurrent: true,
        status: "active",
        stripePriceId: "price_old",
      },
    ],
    ...overrides,
  };
}

describe("plan lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    writeAdminAuditLog.mockResolvedValue(undefined);
    planUpdate.mockResolvedValue({});
    planEntitlementUpsert.mockResolvedValue({});
    planEntitlementCreateMany.mockResolvedValue({ count: 1 });
    planPriceFindMany.mockResolvedValue([]);
    planPriceCreate.mockResolvedValue({});
    archiveStripeProduct.mockResolvedValue({ id: "prod_1", active: false });

    prismaTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          plan: {
            create: planCreate,
            update: planUpdate,
            findUnique: planFindUnique,
          },
          planEntitlement: {
            findMany: planEntitlementFindMany,
            upsert: planEntitlementUpsert,
            createMany: planEntitlementCreateMany,
          },
          planPrice: {
            create: planPriceCreate,
            findMany: planPriceFindMany,
          },
        }),
    );
  });

  it("updatePlanMetadata met à jour les champs commerciaux et audite", async () => {
    planFindUnique.mockResolvedValue(activePlan());
    await updatePlanMetadata(
      {
        planId: PLAN_ID,
        publicName: "Premium Plus",
        displayOrder: 2,
        isFeatured: true,
        isVisibleOnSignup: true,
      },
      ACTOR,
    );
    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicName: "Premium Plus",
          displayOrder: 2,
        }),
      }),
    );
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLAN_METADATA_UPDATE",
        oldValue: expect.any(Object),
        newValue: expect.objectContaining({ result: "success" }),
      }),
    );
  });

  it("hidePlan force isVisibleOnSignup=false", async () => {
    planFindUnique.mockResolvedValue(activePlan());
    await hidePlan({ planId: PLAN_ID, reason: "Pause commerciale" }, ACTOR);
    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "hidden",
          isVisibleOnSignup: false,
        }),
      }),
    );
  });

  it("archivePlan exige une raison et archive Stripe seulement si confirmé", async () => {
    planFindUnique.mockResolvedValue(activePlan());
    await archivePlan(
      {
        planId: PLAN_ID,
        reason: "Fin de vie",
        archiveStripeProduct: false,
      },
      ACTOR,
    );
    expect(archiveStripeProduct).not.toHaveBeenCalled();
    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "archived",
          archivedAt: expect.any(Date),
          isVisibleOnSignup: false,
        }),
      }),
    );

    planFindUnique.mockResolvedValue(activePlan());
    await archivePlan(
      {
        planId: PLAN_ID,
        reason: "Fin de vie",
        archiveStripeProduct: true,
      },
      ACTOR,
    );
    expect(archiveStripeProduct).toHaveBeenCalledWith("prod_1");
  });

  it("refuse de modifier ou réactiver un forfait archivé", async () => {
    planFindUnique.mockResolvedValue(
      activePlan({ status: "archived", archivedAt: new Date() }),
    );
    await expect(
      updatePlanMetadata(
        {
          planId: PLAN_ID,
          publicName: "X",
          displayOrder: 0,
          isFeatured: false,
          isVisibleOnSignup: true,
        },
        ACTOR,
      ),
    ).rejects.toThrow(/archivé/i);

    await expect(
      hidePlan({ planId: PLAN_ID, reason: "nope" }, ACTOR),
    ).rejects.toThrow(/archivé/i);
  });

  it("duplicatePlan crée un nouveau forfait sans réutiliser les IDs Stripe", async () => {
    planFindUnique.mockResolvedValue(activePlan());
    planCreate.mockImplementation(
      async ({ data }: { data: { id: string; internalName: string } }) => ({
        id: data.id,
        internalName: data.internalName,
        status: "pending_reconciliation",
      }),
    );
    createSebavioProduct.mockResolvedValue({ id: "prod_NEW", livemode: false });
    createSebavioPrice.mockResolvedValue({
      id: "price_NEW",
      unit_amount: 1999,
      currency: "cad",
      recurring: { interval: "month", interval_count: 1 },
      livemode: false,
    });

    const result = await duplicatePlan(
      { planId: PLAN_ID, internalName: "premium_copy" },
      ACTOR,
    );

    expect(result.planId).toBeTruthy();
    expect(result.planId).not.toBe(PLAN_ID);
    expect(planCreate.mock.calls[0]?.[0]?.data?.internalName).toBe(
      "premium_copy",
    );
    expect(createSebavioProduct.mock.calls[0]?.[0]?.planId).toBe(result.planId);
    expect(createSebavioProduct.mock.calls[0]?.[0]?.planId).not.toBe(PLAN_ID);
    expect(createSebavioPrice.mock.calls[0]?.[0]?.productId).toBe("prod_NEW");
    expect(createSebavioPrice.mock.calls[0]?.[0]?.productId).not.toBe("prod_1");
  });

  it("setPlanEntitlements upsert sans supprimer les clés absentes", async () => {
    planFindUnique.mockResolvedValue(activePlan());
    planEntitlementFindMany.mockResolvedValue([
      { key: "trips.max", enabled: true, limit: 5, value: null },
      { key: "vehicles.max", enabled: true, limit: 2, value: null },
    ]);

    await setPlanEntitlements(
      {
        planId: PLAN_ID,
        entitlements: [
          { key: "trips.max", enabled: true, limit: 20, value: null },
        ],
      },
      ACTOR,
    );

    expect(planEntitlementUpsert).toHaveBeenCalledTimes(1);
    expect(planEntitlementUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          planId_key: { planId: PLAN_ID, key: "trips.max" },
        },
        update: expect.objectContaining({ limit: 20 }),
      }),
    );
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLAN_ENTITLEMENTS_UPDATE",
        oldValue: expect.any(Object),
        newValue: expect.objectContaining({ result: "success" }),
      }),
    );
  });
});
