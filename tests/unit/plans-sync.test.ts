import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planFindMany,
  planFindUnique,
  planFindFirst,
  planCreate,
  planUpdate,
  planPriceCreate,
  planPriceFindMany,
  planPriceUpdate,
  planEntitlementFindMany,
  planEntitlementCreate,
  planEntitlementUpdate,
  planEntitlementDelete,
  syncRunCreate,
  syncRunFindUnique,
  syncRunUpdate,
  syncActionUpsert,
  syncActionFindMany,
  syncActionFindUnique,
  syncActionUpdate,
  prismaTransaction,
  listSebavioProducts,
  listAllStripeProductsForSync,
  listPricesForProduct,
  getStripeMode,
  writeAdminAuditLog,
} = vi.hoisted(() => ({
  planFindMany: vi.fn(),
  planFindUnique: vi.fn(),
  planFindFirst: vi.fn(),
  planCreate: vi.fn(),
  planUpdate: vi.fn(),
  planPriceCreate: vi.fn(),
  planPriceFindMany: vi.fn(),
  planPriceUpdate: vi.fn(),
  planEntitlementFindMany: vi.fn(),
  planEntitlementCreate: vi.fn(),
  planEntitlementUpdate: vi.fn(),
  planEntitlementDelete: vi.fn(),
  syncRunCreate: vi.fn(),
  syncRunFindUnique: vi.fn(),
  syncRunUpdate: vi.fn(),
  syncActionUpsert: vi.fn(),
  syncActionFindMany: vi.fn(),
  syncActionFindUnique: vi.fn(),
  syncActionUpdate: vi.fn(),
  prismaTransaction: vi.fn(),
  listSebavioProducts: vi.fn(),
  listAllStripeProductsForSync: vi.fn(),
  listPricesForProduct: vi.fn(),
  getStripeMode: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findMany: planFindMany,
      findUnique: planFindUnique,
      findFirst: planFindFirst,
      create: planCreate,
      update: planUpdate,
    },
    planPrice: {
      create: planPriceCreate,
      findMany: planPriceFindMany,
      update: planPriceUpdate,
    },
    planEntitlement: {
      findMany: planEntitlementFindMany,
      create: planEntitlementCreate,
      update: planEntitlementUpdate,
      delete: planEntitlementDelete,
      deleteMany: vi.fn(),
    },
    planSyncRun: {
      create: syncRunCreate,
      findUnique: syncRunFindUnique,
      update: syncRunUpdate,
    },
    planSyncAction: {
      upsert: syncActionUpsert,
      findMany: syncActionFindMany,
      findUnique: syncActionFindUnique,
      update: syncActionUpdate,
      create: vi.fn(),
    },
    $transaction: prismaTransaction,
  },
}));

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/product-service", () => ({
  listSebavioProducts,
}));
vi.mock("@/services/stripe/price-service", () => ({
  listPricesForProduct,
}));
vi.mock("@/features/plans/services/plan-sync-stripe-list", () => ({
  listAllStripeProductsForSync,
}));
vi.mock("@/features/admin/services/audit-write", () => ({
  writeAdminAuditLog,
}));

import {
  applyPlanSync,
  previewPlanSync,
} from "@/features/plans/services/plan-sync";

const ACTOR = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "admin" as const,
};
const SYNC_RUN_ID = "22222222-2222-4222-8222-222222222222";

const sebavioProduct = {
  id: "prod_seb",
  name: "Premium Stripe",
  active: true,
  livemode: false,
  metadata: {
    sebavio_app: "sebavio",
    sebavio_plan_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sebavio_stripe_mode: "test",
  },
};

const foreignProduct = {
  id: "prod_other",
  name: "Other App",
  active: true,
  livemode: false,
  metadata: { app: "other" },
};

describe("plan-sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    writeAdminAuditLog.mockResolvedValue(undefined);
    planFindFirst.mockResolvedValue(null);
    planEntitlementFindMany.mockResolvedValue([
      { key: "trips.max", enabled: true, limit: 5, value: null },
    ]);
    planCreate.mockImplementation(
      async ({ data }: { data: { id: string } }) => ({
        ...data,
        id: data.id,
      }),
    );
    planPriceCreate.mockResolvedValue({});
    planUpdate.mockResolvedValue({});
    syncActionUpdate.mockResolvedValue({});
    syncActionUpsert.mockImplementation(
      async ({ create, update }: { create: unknown; update: unknown }) => ({
        ...(create as object),
        ...(update as object),
        status: (create as { status?: string }).status ?? "pending",
      }),
    );

    syncRunCreate.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: SYNC_RUN_ID,
        ...data,
      }),
    );

    prismaTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          plan: {
            create: planCreate,
            update: planUpdate,
            findUnique: planFindUnique,
          },
          planPrice: { create: planPriceCreate, findMany: planPriceFindMany },
          planEntitlement: {
            findMany: planEntitlementFindMany,
            create: planEntitlementCreate,
            update: planEntitlementUpdate,
            delete: planEntitlementDelete,
          },
          planSyncAction: {
            upsert: syncActionUpsert,
            findUnique: syncActionFindUnique,
            update: syncActionUpdate,
          },
          planSyncRun: { update: syncRunUpdate },
        };
        return fn(tx);
      },
    );
  });

  it("preview répété produit un rapport structurellement identique", async () => {
    listAllStripeProductsForSync.mockResolvedValue([
      sebavioProduct,
      foreignProduct,
    ]);
    listSebavioProducts.mockResolvedValue([sebavioProduct]);
    listPricesForProduct.mockResolvedValue([
      {
        id: "price_1",
        unit_amount: 1000,
        currency: "cad",
        active: true,
        livemode: false,
        recurring: { interval: "month", interval_count: 1 },
      },
    ]);
    planFindMany.mockResolvedValue([]);

    const a = await previewPlanSync();
    const b = await previewPlanSync();

    expect(a.toCreateLocally.map((x) => x.actionKey)).toEqual(
      b.toCreateLocally.map((x) => x.actionKey),
    );
    expect(a.ignored.map((x) => x.id)).toEqual(b.ignored.map((x) => x.id));
    expect(a.toCreateLocally[0]?.actionType).toBe("import_product");
  });

  it("ignore les produits étrangers", async () => {
    listAllStripeProductsForSync.mockResolvedValue([foreignProduct]);
    listSebavioProducts.mockResolvedValue([]);
    planFindMany.mockResolvedValue([]);

    const report = await previewPlanSync();
    expect(report.toCreateLocally).toHaveLength(0);
    expect(report.ignored.some((i) => i.id === "prod_other")).toBe(true);
  });

  it("propose un import sans isCurrent ni entitlements", async () => {
    listAllStripeProductsForSync.mockResolvedValue([sebavioProduct]);
    listSebavioProducts.mockResolvedValue([sebavioProduct]);
    listPricesForProduct.mockResolvedValue([
      {
        id: "price_1",
        unit_amount: 1000,
        currency: "cad",
        active: true,
        livemode: false,
        recurring: { interval: "month", interval_count: 1 },
      },
    ]);
    planFindMany.mockResolvedValue([]);

    const report = await previewPlanSync();
    const action = report.toCreateLocally[0];
    expect(action?.payload).toEqual(
      expect.objectContaining({
        stripeProductId: "prod_seb",
        status: expect.stringMatching(/hidden|pending_reconciliation/),
        prices: [
          expect.objectContaining({
            stripePriceId: "price_1",
            isCurrent: false,
          }),
        ],
      }),
    );
    expect(JSON.stringify(action?.payload)).not.toMatch(/entitlement/i);
  });

  it("détecte les incohérences locales", async () => {
    listAllStripeProductsForSync.mockResolvedValue([]);
    listSebavioProducts.mockResolvedValue([]);
    planFindMany.mockResolvedValue([
      {
        id: "plan_1",
        stripeProductId: "prod_missing",
        stripeMode: "test",
        status: "active",
        publicName: "X",
        prices: [
          {
            id: "pp1",
            stripePriceId: "price_gone",
            isCurrent: true,
            interval: "month",
            intervalCount: 1,
            currency: "cad",
            unitAmount: 1000,
            status: "active",
          },
          {
            id: "pp2",
            stripePriceId: "price_gone2",
            isCurrent: true,
            interval: "month",
            intervalCount: 1,
            currency: "cad",
            unitAmount: 2000,
            status: "active",
          },
        ],
        entitlements: [
          { key: "trips.max", enabled: true, limit: 1, value: null },
        ],
      },
    ]);
    listPricesForProduct.mockRejectedValue(new Error("not found"));

    const report = await previewPlanSync();
    expect(report.inconsistencies.length).toBeGreaterThan(0);
    expect(
      report.inconsistencies.some((i) => /is_current|courant/i.test(i.message)),
    ).toBe(true);
  });

  it("apply n'altère pas les entitlements et ignore les actions non confirmées", async () => {
    const entitlementsBefore = [
      { key: "trips.max", enabled: true, limit: 5, value: null },
    ];
    planEntitlementFindMany.mockResolvedValue(entitlementsBefore);

    syncRunFindUnique.mockResolvedValue({
      id: SYNC_RUN_ID,
      stripeMode: "test",
      status: "preview",
      report: {
        toCreateLocally: [
          {
            actionKey: "import:prod_seb",
            actionType: "import_product",
            payload: {
              stripeProductId: "prod_seb",
              name: "Premium Stripe",
              status: "hidden",
              prices: [
                {
                  stripePriceId: "price_1",
                  unitAmount: 1000,
                  currency: "cad",
                  interval: "month",
                  intervalCount: 1,
                  isCurrent: false,
                },
              ],
            },
          },
          {
            actionKey: "import:prod_other",
            actionType: "import_product",
            payload: { stripeProductId: "prod_other", prices: [] },
          },
        ],
      },
      actions: [],
    });

    syncActionFindUnique.mockResolvedValue(null);

    const result = await applyPlanSync(
      {
        syncRunId: SYNC_RUN_ID,
        confirmedActions: [
          {
            actionKey: "import:prod_seb",
            actionType: "import_product",
          },
        ],
      },
      ACTOR,
    );

    expect(result.applied).toContain("import:prod_seb");
    expect(result.skipped).not.toContain("import:prod_other");
    expect(planCreate).toHaveBeenCalled();
    expect(planPriceCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isCurrent: false }),
      }),
    );
    expect(planEntitlementCreate).not.toHaveBeenCalled();
    expect(planEntitlementUpdate).not.toHaveBeenCalled();
    expect(planEntitlementDelete).not.toHaveBeenCalled();
  });

  it("apply répété ne rejoue pas une action déjà applied", async () => {
    syncRunFindUnique.mockResolvedValue({
      id: SYNC_RUN_ID,
      stripeMode: "test",
      status: "preview",
      report: {
        toCreateLocally: [
          {
            actionKey: "import:prod_seb",
            actionType: "import_product",
            payload: {
              stripeProductId: "prod_seb",
              name: "P",
              status: "hidden",
              prices: [],
            },
          },
        ],
      },
      actions: [],
    });

    syncActionFindUnique.mockResolvedValue({
      syncRunId: SYNC_RUN_ID,
      actionKey: "import:prod_seb",
      status: "applied",
    });

    const result = await applyPlanSync(
      {
        syncRunId: SYNC_RUN_ID,
        confirmedActions: [
          { actionKey: "import:prod_seb", actionType: "import_product" },
        ],
      },
      ACTOR,
    );

    expect(result.skipped).toContain("import:prod_seb");
    expect(planCreate).not.toHaveBeenCalled();
  });

  it("échec partiel est tracé et reprise contrôlée possible", async () => {
    syncRunFindUnique.mockResolvedValue({
      id: SYNC_RUN_ID,
      stripeMode: "test",
      status: "preview",
      report: {
        toCreateLocally: [
          {
            actionKey: "import:prod_seb",
            actionType: "import_product",
            payload: {
              stripeProductId: "prod_seb",
              name: "P",
              status: "hidden",
              prices: [],
            },
          },
        ],
      },
      actions: [],
    });

    syncActionFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      syncRunId: SYNC_RUN_ID,
      actionKey: "import:prod_seb",
      status: "failed",
      error: "db fail",
    });

    planCreate.mockRejectedValueOnce(new Error("db fail"));

    await expect(
      applyPlanSync(
        {
          syncRunId: SYNC_RUN_ID,
          confirmedActions: [
            { actionKey: "import:prod_seb", actionType: "import_product" },
          ],
        },
        ACTOR,
      ),
    ).rejects.toThrow(/db fail/i);

    expect(syncActionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed" }),
      }),
    );

    // reprise
    planCreate.mockResolvedValue({ id: "plan_ok" });
    syncActionFindUnique.mockResolvedValue({
      syncRunId: SYNC_RUN_ID,
      actionKey: "import:prod_seb",
      status: "failed",
      error: "db fail",
    });

    const retry = await applyPlanSync(
      {
        syncRunId: SYNC_RUN_ID,
        confirmedActions: [
          { actionKey: "import:prod_seb", actionType: "import_product" },
        ],
      },
      ACTOR,
    );
    expect(retry.applied).toContain("import:prod_seb");
  });

  it("rejette un syncRun d'un autre mode Stripe", async () => {
    syncRunFindUnique.mockResolvedValue({
      id: SYNC_RUN_ID,
      stripeMode: "live",
      status: "preview",
      report: { toCreateLocally: [] },
      actions: [],
    });
    await expect(
      applyPlanSync({ syncRunId: SYNC_RUN_ID, confirmedActions: [] }, ACTOR),
    ).rejects.toThrow(/mode/i);
  });
});
