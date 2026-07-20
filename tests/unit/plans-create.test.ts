import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planCreate,
  planFindUnique,
  planUpdate,
  planPriceCreate,
  planPriceFindMany,
  planEntitlementCreateMany,
  prismaTransaction,
  createSebavioProduct,
  createSebavioPrice,
  listPricesForProduct,
  listSebavioProducts,
  getStripeMode,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planCreate: vi.fn(),
  planFindUnique: vi.fn(),
  planUpdate: vi.fn(),
  planPriceCreate: vi.fn(),
  planPriceFindMany: vi.fn(),
  planEntitlementCreateMany: vi.fn(),
  prismaTransaction: vi.fn(),
  createSebavioProduct: vi.fn(),
  createSebavioPrice: vi.fn(),
  listPricesForProduct: vi.fn(),
  listSebavioProducts: vi.fn(),
  getStripeMode: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      create: planCreate,
      findUnique: planFindUnique,
      update: planUpdate,
    },
    planPrice: {
      create: planPriceCreate,
      findMany: planPriceFindMany,
    },
    planEntitlement: {
      createMany: planEntitlementCreateMany,
    },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/services/stripe/config", () => ({
  getStripeMode,
}));

vi.mock("@/services/stripe/product-service", () => ({
  createSebavioProduct,
  listSebavioProducts,
}));

vi.mock("@/services/stripe/price-service", () => ({
  createSebavioPrice,
  listPricesForProduct,
}));

vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  createPlan,
  planProductIdempotencyKey,
  planPriceIdempotencyKey,
  reconcilePlan,
} from "@/features/plans/services/plan-crud";

const PLAN_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACTOR = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  role: "admin" as const,
  ipAddress: "127.0.0.1",
};

const createInput = {
  internalName: "premium",
  publicName: "Premium",
  shortDescription: "Desc",
  displayOrder: 0,
  isFeatured: false,
  isVisibleOnSignup: true,
  defaultTrialDays: 7,
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
  entitlements: [
    {
      key: "trips.max" as const,
      enabled: true,
      limit: 10,
      value: null,
    },
  ],
};

function pendingPlan(overrides: Record<string, unknown> = {}) {
  return {
    id: PLAN_ID,
    internalName: "premium",
    publicName: "Premium",
    shortDescription: "Desc",
    fullDescription: null,
    displayOrder: 0,
    isFeatured: false,
    isVisibleOnSignup: true,
    defaultTrialDays: 7,
    status: "pending_reconciliation",
    archivedAt: null,
    stripeProductId: null,
    stripeMode: "test",
    lastSyncedAt: null,
    reconciliationError: null,
    prices: [],
    entitlements: [
      {
        key: "trips.max",
        enabled: true,
        limit: 10,
        value: null,
      },
    ],
    ...overrides,
  };
}

describe("plan-crud create / reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    writeAdminAuditLog.mockResolvedValue(undefined);
    planUpdate.mockResolvedValue({});
    planPriceCreate.mockResolvedValue({});
    planEntitlementCreateMany.mockResolvedValue({ count: 1 });
    planPriceFindMany.mockResolvedValue([]);

    planCreate.mockImplementation(async ({ data }: { data: { id?: string } }) =>
      pendingPlan({ id: data.id ?? PLAN_ID }),
    );

    prismaTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          plan: {
            create: planCreate,
            update: planUpdate,
            findUnique: planFindUnique,
          },
          planPrice: {
            create: planPriceCreate,
            findMany: planPriceFindMany,
          },
          planEntitlement: {
            createMany: planEntitlementCreateMany,
          },
        };
        return fn(tx);
      },
    );
  });

  it("crée un forfait avec prix mensuel et annuel + entitlements", async () => {
    createSebavioProduct.mockResolvedValue({
      id: "prod_1",
      livemode: false,
    });
    createSebavioPrice
      .mockResolvedValueOnce({
        id: "price_m",
        livemode: false,
        unit_amount: 1999,
        currency: "cad",
        recurring: { interval: "month", interval_count: 1 },
      })
      .mockResolvedValueOnce({
        id: "price_y",
        livemode: false,
        unit_amount: 19999,
        currency: "cad",
        recurring: { interval: "year", interval_count: 1 },
      });

    const result = await createPlan(createInput, ACTOR);
    expect(result.planId).toBeTruthy();

    expect(planCreate).toHaveBeenCalled();
    const createdData = planCreate.mock.calls[0]?.[0]?.data;
    expect(createdData.status).toBe("pending_reconciliation");
    expect(createdData.stripeMode).toBe("test");
    expect(createdData.stripeProductId).toBeNull();

    expect(planEntitlementCreateMany).toHaveBeenCalled();
    expect(createSebavioProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        planId: result.planId,
        name: "Premium",
        idempotencyKey: planProductIdempotencyKey(result.planId),
      }),
    );

    expect(createSebavioPrice).toHaveBeenCalledTimes(2);
    expect(planPriceCreate).toHaveBeenCalledTimes(2);
    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "active",
          stripeProductId: "prod_1",
          reconciliationError: null,
        }),
      }),
    );

    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLAN_CREATE_SUCCESS",
        entity: "plan",
        newValue: expect.objectContaining({
          result: "success",
          stripeMode: "test",
        }),
      }),
    );
  });

  it("utilise les clés d'idempotence exactes", async () => {
    createSebavioProduct.mockResolvedValue({ id: "prod_1", livemode: false });
    createSebavioPrice.mockResolvedValue({
      id: "price_m",
      livemode: false,
      unit_amount: 1999,
      currency: "cad",
      recurring: { interval: "month", interval_count: 1 },
    });

    const single = {
      ...createInput,
      prices: [createInput.prices[0]!],
    };
    const { planId } = await createPlan(single, ACTOR);

    expect(createSebavioProduct.mock.calls[0]?.[0]?.idempotencyKey).toBe(
      `plan-create:${planId}:product`,
    );
    expect(createSebavioPrice.mock.calls[0]?.[0]?.idempotencyKey).toBe(
      `plan-create:${planId}:price:month:1:cad`,
    );
    expect(planPriceIdempotencyKey(planId, "month", 1, "cad")).toBe(
      `plan-create:${planId}:price:month:1:cad`,
    );
  });

  it("rejette un mode Stripe incorrect sur le produit", async () => {
    createSebavioProduct.mockRejectedValue(
      new Error("Objet Stripe livemode incompatible"),
    );

    await expect(createPlan(createInput, ACTOR)).rejects.toThrow(/livemode/i);

    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending_reconciliation",
          reconciliationError: expect.any(String),
        }),
      }),
    );
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLAN_CREATE_PARTIAL_FAILURE",
        newValue: expect.objectContaining({ result: "error" }),
      }),
    );
  });

  it("conserve pending_reconciliation si échec products.create", async () => {
    createSebavioProduct.mockRejectedValue(new Error("stripe down"));

    await expect(createPlan(createInput, ACTOR)).rejects.toThrow();

    expect(createSebavioPrice).not.toHaveBeenCalled();
    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending_reconciliation",
          reconciliationError: expect.stringMatching(/stripe/i),
        }),
      }),
    );
  });

  it("conserve pending_reconciliation si échec après produit", async () => {
    createSebavioProduct.mockResolvedValue({ id: "prod_1", livemode: false });
    createSebavioPrice.mockRejectedValue(new Error("price fail"));

    await expect(createPlan(createInput, ACTOR)).rejects.toThrow(/price fail/i);

    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending_reconciliation",
          reconciliationError: expect.any(String),
        }),
      }),
    );
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PLAN_CREATE_PARTIAL_FAILURE" }),
    );
  });

  it("échec sur un prix laisse pending_reconciliation", async () => {
    createSebavioProduct.mockResolvedValue({ id: "prod_1", livemode: false });
    createSebavioPrice
      .mockResolvedValueOnce({
        id: "price_m",
        livemode: false,
        unit_amount: 1999,
        currency: "cad",
        recurring: { interval: "month", interval_count: 1 },
      })
      .mockRejectedValueOnce(new Error("second price fail"));

    await expect(createPlan(createInput, ACTOR)).rejects.toThrow(
      /second price fail/i,
    );
    expect(planPriceCreate).not.toHaveBeenCalled();
  });

  it("échec DB final laisse pending_reconciliation", async () => {
    createSebavioProduct.mockResolvedValue({ id: "prod_1", livemode: false });
    createSebavioPrice.mockResolvedValue({
      id: "price_m",
      livemode: false,
      unit_amount: 1999,
      currency: "cad",
      recurring: { interval: "month", interval_count: 1 },
    });

    let txCalls = 0;
    prismaTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        txCalls += 1;
        const tx = {
          plan: {
            create: planCreate,
            update: planUpdate,
            findUnique: planFindUnique,
          },
          planPrice: { create: planPriceCreate, findMany: planPriceFindMany },
          planEntitlement: { createMany: planEntitlementCreateMany },
        };
        if (txCalls === 1) return fn(tx);
        throw new Error("db finalize fail");
      },
    );

    const single = {
      ...createInput,
      prices: [createInput.prices[0]!],
    };
    await expect(createPlan(single, ACTOR)).rejects.toThrow(/db finalize/i);

    expect(planUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "pending_reconciliation",
          reconciliationError: expect.any(String),
        }),
      }),
    );
  });

  it("reconcilePlan finalise un forfait pending avec produit Stripe existant", async () => {
    planFindUnique.mockResolvedValue(
      pendingPlan({
        stripeProductId: null,
        entitlements: createInput.entitlements,
      }),
    );
    listSebavioProducts.mockResolvedValue([
      {
        id: "prod_existing",
        livemode: false,
        metadata: {
          sebavio_app: "sebavio",
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "test",
        },
      },
    ]);
    listPricesForProduct.mockResolvedValue([]);
    createSebavioProduct.mockResolvedValue({
      id: "prod_existing",
      livemode: false,
    });
    createSebavioPrice
      .mockResolvedValueOnce({
        id: "price_m",
        livemode: false,
        unit_amount: 1999,
        currency: "cad",
        recurring: { interval: "month", interval_count: 1 },
      })
      .mockResolvedValueOnce({
        id: "price_y",
        livemode: false,
        unit_amount: 19999,
        currency: "cad",
        recurring: { interval: "year", interval_count: 1 },
      });

    // reconcile needs desired prices — store on plan via reconciliation payload
    // Implementation reads from plan + optional stored intent; for reconcile we pass prices from last known create via finding pending plan fields only.
    // Spec: retry same idempotency — reconcile uses plan metadata + creates missing prices from Stripe list or from input.
    // Our reconcilePlan(planId, actor, prices?) — tests will pass prices for pending plans.

    const result = await reconcilePlan(PLAN_ID, ACTOR, {
      prices: createInput.prices,
    });
    expect(result.status).toBe("active");
    expect(createSebavioPrice).toHaveBeenCalled();
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: expect.stringMatching(
          /PLAN_RECONCILE_SUCCESS|PLAN_CREATE_SUCCESS/,
        ),
      }),
    );
  });

  it("nouvelle tentative sans duplication de PlanPrice", async () => {
    planFindUnique.mockResolvedValue(
      pendingPlan({
        stripeProductId: "prod_1",
        prices: [
          {
            stripePriceId: "price_m",
            interval: "month",
            intervalCount: 1,
            currency: "cad",
            unitAmount: 1999,
          },
        ],
      }),
    );
    planPriceFindMany.mockResolvedValue([{ stripePriceId: "price_m" }]);
    listPricesForProduct.mockResolvedValue([
      {
        id: "price_m",
        livemode: false,
        unit_amount: 1999,
        currency: "cad",
        recurring: { interval: "month", interval_count: 1 },
        metadata: {
          sebavio_plan_id: PLAN_ID,
          sebavio_app: "sebavio",
          sebavio_stripe_mode: "test",
        },
      },
      {
        id: "price_y",
        livemode: false,
        unit_amount: 19999,
        currency: "cad",
        recurring: { interval: "year", interval_count: 1 },
        metadata: {
          sebavio_plan_id: PLAN_ID,
          sebavio_app: "sebavio",
          sebavio_stripe_mode: "test",
        },
      },
    ]);
    createSebavioPrice.mockResolvedValue({
      id: "price_y",
      livemode: false,
      unit_amount: 19999,
      currency: "cad",
      recurring: { interval: "year", interval_count: 1 },
    });

    await reconcilePlan(PLAN_ID, ACTOR, {
      prices: createInput.prices,
    });

    // only missing year price row created locally
    expect(planPriceCreate).toHaveBeenCalledTimes(1);
    expect(planPriceCreate.mock.calls[0]?.[0]?.data?.stripePriceId).toBe(
      "price_y",
    );
  });

  it("audite l'échec partiel", async () => {
    createSebavioProduct.mockRejectedValue(new Error("boom"));
    await expect(createPlan(createInput, ACTOR)).rejects.toThrow();
    expect(writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "PLAN_CREATE_PARTIAL_FAILURE",
        actorUserId: ACTOR.id,
        newValue: expect.objectContaining({
          result: "error",
          stripeMode: "test",
        }),
      }),
    );
  });
});
