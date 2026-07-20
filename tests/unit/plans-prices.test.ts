import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planFindUnique,
  planUpdate,
  planPriceFindMany,
  planPriceCreate,
  planPriceUpdateMany,
  planPriceUpdate,
  stripeSubscriptionUpdate,
  prismaTransaction,
  createSebavioPrice,
  deactivateStripePrice,
  getStripeMode,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planFindUnique: vi.fn(),
  planUpdate: vi.fn(),
  planPriceFindMany: vi.fn(),
  planPriceCreate: vi.fn(),
  planPriceUpdateMany: vi.fn(),
  planPriceUpdate: vi.fn(),
  stripeSubscriptionUpdate: vi.fn(),
  prismaTransaction: vi.fn(),
  createSebavioPrice: vi.fn(),
  deactivateStripePrice: vi.fn(),
  getStripeMode: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findUnique: planFindUnique, update: planUpdate },
    planPrice: {
      findMany: planPriceFindMany,
      create: planPriceCreate,
      updateMany: planPriceUpdateMany,
      update: planPriceUpdate,
    },
    stripeSubscription: {
      update: stripeSubscriptionUpdate,
      updateMany: vi.fn(),
    },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/price-service", () => ({
  createSebavioPrice,
  deactivateStripePrice,
}));
vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  createNewPlanPrice,
  planPriceOperationIdempotencyKey,
} from "@/features/plans/services/plan-prices";

const PLAN_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OP_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OP_ID_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACTOR = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  role: "admin" as const,
};

const baseInput = {
  planId: PLAN_ID,
  unitAmount: 2000,
  currency: "cad" as const,
  interval: "month" as const,
  intervalCount: 1,
  archivePreviousForNewSubscribers: false,
  operationId: OP_ID,
};

describe("createNewPlanPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    writeAdminAuditLog.mockResolvedValue(undefined);
    deactivateStripePrice.mockResolvedValue({ id: "price_old", active: false });
    planPriceUpdateMany.mockResolvedValue({ count: 1 });
    planPriceCreate.mockResolvedValue({
      id: "pp_new",
      stripePriceId: "price_new",
      isCurrent: true,
    });

    planFindUnique.mockResolvedValue({
      id: PLAN_ID,
      status: "active",
      stripeMode: "test",
      stripeProductId: "prod_1",
      prices: [
        {
          id: "pp_old",
          stripePriceId: "price_old",
          interval: "month",
          intervalCount: 1,
          currency: "cad",
          unitAmount: 1000,
          isCurrent: true,
          status: "active",
        },
      ],
    });

    prismaTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          planPrice: {
            updateMany: planPriceUpdateMany,
            create: planPriceCreate,
            findMany: planPriceFindMany,
          },
        };
        return fn(tx);
      },
    );

    createSebavioPrice.mockResolvedValue({
      id: "price_new",
      unit_amount: 2000,
      currency: "cad",
      recurring: { interval: "month", interval_count: 1 },
    });
  });

  it("bascule isCurrent atomiquement vers le nouveau prix", async () => {
    const result = await createNewPlanPrice(baseInput, ACTOR);

    expect(result.planPriceId).toBe("pp_new");
    expect(createSebavioPrice).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: `plan-price:${PLAN_ID}:month:1:cad:${OP_ID}`,
      }),
    );
    expect(planPriceUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          planId: PLAN_ID,
          interval: "month",
          intervalCount: 1,
          currency: "cad",
          isCurrent: true,
        }),
        data: expect.objectContaining({ isCurrent: false }),
      }),
    );
    expect(planPriceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stripePriceId: "price_new",
          isCurrent: true,
          unitAmount: 2000,
        }),
      }),
    );
    expect(deactivateStripePrice).not.toHaveBeenCalled();
    expect(stripeSubscriptionUpdate).not.toHaveBeenCalled();
  });

  it("clé d'idempotence déterministe pour le même operationId", async () => {
    const keyA = planPriceOperationIdempotencyKey({
      planId: PLAN_ID,
      interval: "month",
      intervalCount: 1,
      currency: "cad",
      operationId: OP_ID,
    });
    const keyB = planPriceOperationIdempotencyKey({
      planId: PLAN_ID,
      interval: "month",
      intervalCount: 1,
      currency: "CAD",
      operationId: OP_ID,
    });
    expect(keyA).toBe(keyB);
    expect(keyA).toBe(`plan-price:${PLAN_ID}:month:1:cad:${OP_ID}`);

    await createNewPlanPrice(baseInput, ACTOR);
    await createNewPlanPrice(baseInput, ACTOR);
    expect(createSebavioPrice.mock.calls[0]?.[0]?.idempotencyKey).toBe(keyA);
    expect(createSebavioPrice.mock.calls[1]?.[0]?.idempotencyKey).toBe(keyA);
  });

  it("deux operationId distincts produisent deux clés différentes", async () => {
    await createNewPlanPrice(baseInput, ACTOR);
    await createNewPlanPrice({ ...baseInput, operationId: OP_ID_2 }, ACTOR);
    expect(createSebavioPrice.mock.calls[0]?.[0]?.idempotencyKey).toBe(
      `plan-price:${PLAN_ID}:month:1:cad:${OP_ID}`,
    );
    expect(createSebavioPrice.mock.calls[1]?.[0]?.idempotencyKey).toBe(
      `plan-price:${PLAN_ID}:month:1:cad:${OP_ID_2}`,
    );
    expect(createSebavioPrice.mock.calls[0]?.[0]?.idempotencyKey).not.toBe(
      createSebavioPrice.mock.calls[1]?.[0]?.idempotencyKey,
    );
  });

  it("rejette un operationId non UUID", async () => {
    await expect(
      createNewPlanPrice({ ...baseInput, operationId: "not-a-uuid" }, ACTOR),
    ).rejects.toThrow();
    expect(createSebavioPrice).not.toHaveBeenCalled();
  });

  it("conserve l'ancien prix Stripe par défaut", async () => {
    await createNewPlanPrice(
      { ...baseInput, archivePreviousForNewSubscribers: false },
      ACTOR,
    );
    expect(deactivateStripePrice).not.toHaveBeenCalled();
  });

  it("désactive l'ancien prix Stripe seulement si confirmé", async () => {
    await createNewPlanPrice(
      { ...baseInput, archivePreviousForNewSubscribers: true },
      ACTOR,
    );
    expect(deactivateStripePrice).toHaveBeenCalledWith("price_old");
  });

  it("rollback DB : n'écrit pas le nouveau PlanPrice si la transaction échoue", async () => {
    prismaTransaction.mockRejectedValue(new Error("db fail"));

    await expect(createNewPlanPrice(baseInput, ACTOR)).rejects.toThrow(
      /db fail/i,
    );

    expect(planPriceCreate).not.toHaveBeenCalled();
  });

  it("rejette un forfait archivé ou un mode incohérent", async () => {
    planFindUnique.mockResolvedValue({
      id: PLAN_ID,
      status: "archived",
      stripeMode: "test",
      stripeProductId: "prod_1",
      prices: [],
    });
    await expect(createNewPlanPrice(baseInput, ACTOR)).rejects.toThrow(
      /archivé/i,
    );

    planFindUnique.mockResolvedValue({
      id: PLAN_ID,
      status: "active",
      stripeMode: "live",
      stripeProductId: "prod_1",
      prices: [],
    });
    getStripeMode.mockReturnValue("test");
    await expect(createNewPlanPrice(baseInput, ACTOR)).rejects.toThrow(/mode/i);
  });
});
