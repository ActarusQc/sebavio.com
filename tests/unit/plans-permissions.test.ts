import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requirePermission,
  revalidatePath,
  listPlans,
  getPlan,
  createPlan,
  updatePlanMetadata,
  setPlanEntitlements,
  createNewPlanPrice,
  hidePlan,
  archivePlan,
  duplicatePlan,
  previewPlanSync,
  applyPlanSync,
  reconcilePlan,
  getStripeMode,
  planFindMany,
  planFindFirst,
  countSubscribersForPlan,
} = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  revalidatePath: vi.fn(),
  listPlans: vi.fn(),
  getPlan: vi.fn(),
  createPlan: vi.fn(),
  updatePlanMetadata: vi.fn(),
  setPlanEntitlements: vi.fn(),
  createNewPlanPrice: vi.fn(),
  hidePlan: vi.fn(),
  archivePlan: vi.fn(),
  duplicatePlan: vi.fn(),
  previewPlanSync: vi.fn(),
  applyPlanSync: vi.fn(),
  reconcilePlan: vi.fn(),
  getStripeMode: vi.fn(),
  planFindMany: vi.fn(),
  planFindFirst: vi.fn(),
  countSubscribersForPlan: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: () => null,
  })),
}));

vi.mock("@/features/auth", () => ({
  requirePermission,
}));

vi.mock("@/features/plans/services/plan-queries", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/plans/services/plan-queries")
    >();
  return {
    ...actual,
    listPlans,
    getPlan,
  };
});

vi.mock("@/features/plans/services/plan-crud", () => ({
  createPlan,
  updatePlanMetadata,
  hidePlan,
  archivePlan,
  duplicatePlan,
  reconcilePlan,
}));

vi.mock("@/features/plans/services/plan-entitlements", () => ({
  setPlanEntitlements,
}));

vi.mock("@/features/plans/services/plan-prices", () => ({
  createNewPlanPrice,
}));

vi.mock("@/features/plans/services/plan-sync", () => ({
  previewPlanSync,
  applyPlanSync,
}));

vi.mock("@/features/plans/lib/subscriber-counts", () => ({
  countSubscribersForPlan,
  PLAN_ACTIVE_SUBSCRIPTION_STATUSES: ["active", "trialing", "past_due"],
}));

vi.mock("@/services/stripe/config", () => ({
  getStripeMode,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findMany: planFindMany,
      findFirst: planFindFirst,
    },
  },
}));

import { AppError } from "@/lib/errors";
import {
  listPlansAction,
  getPlanAction,
  createPlanAction,
  updatePlanMetadataAction,
  setPlanEntitlementsAction,
  createPlanPriceAction,
  hidePlanAction,
  archivePlanAction,
  duplicatePlanAction,
  previewPlanSyncAction,
  applyPlanSyncAction,
  reconcilePlanAction,
} from "@/features/plans/actions";

const PLAN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACTOR_READ = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  role: "billing_admin" as const,
  email: "billing@example.com",
};
const ACTOR_MANAGE = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  role: "admin" as const,
  email: "admin@example.com",
};

const validCreateInput = {
  internalName: "premium",
  publicName: "Premium",
  displayOrder: 0,
  isFeatured: false,
  isVisibleOnSignup: true,
  prices: [
    {
      unitAmount: 1999,
      currency: "cad",
      interval: "month" as const,
      intervalCount: 1,
    },
  ],
};

describe("plans permissions + actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
  });

  it("plans.read autorise la lecture (liste, détail, preview)", async () => {
    requirePermission.mockResolvedValue(ACTOR_READ);
    listPlans.mockResolvedValue([]);
    getPlan.mockResolvedValue({ id: PLAN_ID });
    previewPlanSync.mockResolvedValue({ syncRunId: PLAN_ID });

    await expect(listPlansAction({})).resolves.toEqual({
      ok: true,
      data: [],
    });
    await expect(getPlanAction({ planId: PLAN_ID })).resolves.toMatchObject({
      ok: true,
    });
    await expect(previewPlanSyncAction()).resolves.toMatchObject({ ok: true });

    expect(requirePermission).toHaveBeenCalledWith("plans.read");
    expect(listPlans).toHaveBeenCalled();
    expect(getPlan).toHaveBeenCalled();
    expect(previewPlanSync).toHaveBeenCalled();
  });

  it("plans.read seul refuse toutes les mutations", async () => {
    requirePermission.mockRejectedValue(
      new AppError("ADM_001", "Accès refusé", 403),
    );

    const mutations = [
      () => createPlanAction(validCreateInput),
      () =>
        updatePlanMetadataAction({
          planId: PLAN_ID,
          publicName: "X",
          displayOrder: 0,
          isFeatured: false,
          isVisibleOnSignup: true,
        }),
      () =>
        setPlanEntitlementsAction({
          planId: PLAN_ID,
          entitlements: [],
        }),
      () =>
        createPlanPriceAction({
          planId: PLAN_ID,
          unitAmount: 1000,
          currency: "cad",
          interval: "month",
          intervalCount: 1,
          archivePreviousForNewSubscribers: false,
          operationId: PLAN_ID,
        }),
      () => hidePlanAction({ planId: PLAN_ID, reason: "test reason" }),
      () =>
        archivePlanAction({
          planId: PLAN_ID,
          reason: "test reason",
          archiveStripeProduct: false,
        }),
      () =>
        duplicatePlanAction({
          planId: PLAN_ID,
          internalName: "premium_copy",
        }),
      () =>
        applyPlanSyncAction({
          syncRunId: PLAN_ID,
          confirmedActions: [],
        }),
      () => reconcilePlanAction({ planId: PLAN_ID }),
    ];

    for (const run of mutations) {
      const result = await run();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Accès refusé");
        expect(result.code).toBe("ADM_001");
      }
    }

    expect(createPlan).not.toHaveBeenCalled();
    expect(updatePlanMetadata).not.toHaveBeenCalled();
    expect(setPlanEntitlements).not.toHaveBeenCalled();
    expect(createNewPlanPrice).not.toHaveBeenCalled();
    expect(hidePlan).not.toHaveBeenCalled();
    expect(archivePlan).not.toHaveBeenCalled();
    expect(duplicatePlan).not.toHaveBeenCalled();
    expect(applyPlanSync).not.toHaveBeenCalled();
    expect(reconcilePlan).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("plans.manage autorise les mutations", async () => {
    requirePermission.mockResolvedValue(ACTOR_MANAGE);
    createPlan.mockResolvedValue({ planId: PLAN_ID });

    const result = await createPlanAction(validCreateInput);
    expect(result).toEqual({ ok: true, data: { planId: PLAN_ID } });
    expect(requirePermission).toHaveBeenCalledWith("plans.manage");
    expect(createPlan).toHaveBeenCalled();
  });

  it("permission vérifiée avant l'exécution du service", async () => {
    const order: string[] = [];
    requirePermission.mockImplementation(async () => {
      order.push("permission");
      throw new AppError("ADM_001", "Accès refusé", 403);
    });
    createPlan.mockImplementation(async () => {
      order.push("service");
      return { planId: PLAN_ID };
    });

    await createPlanAction(validCreateInput);
    expect(order).toEqual(["permission"]);
    expect(createPlan).not.toHaveBeenCalled();
  });

  it("entrée Zod invalide n'appelle pas le service", async () => {
    requirePermission.mockResolvedValue(ACTOR_MANAGE);

    const result = await createPlanAction({
      internalName: "!!!",
      publicName: "",
      prices: [],
    });

    expect(result.ok).toBe(false);
    expect(createPlan).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("erreur métier convertie en résultat sûr (sans secret Stripe)", async () => {
    requirePermission.mockResolvedValue(ACTOR_MANAGE);
    createPlan.mockRejectedValue(
      new AppError(
        "STRIPE_009",
        "Échec avec sk_test_51SecretKeyLeakABCDEFG",
        400,
      ),
    );

    const result = await createPlanAction(validCreateInput);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).not.toMatch(/sk_test_/);
      expect(result.error).toContain("[REDACTED]");
      expect(result.code).toBe("STRIPE_009");
    }
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("mutation réussie déclenche la revalidation attendue", async () => {
    requirePermission.mockResolvedValue(ACTOR_MANAGE);
    createPlan.mockResolvedValue({ planId: PLAN_ID });

    await createPlanAction(validCreateInput);

    expect(revalidatePath).toHaveBeenCalledWith("/admin/plans");
    expect(revalidatePath).toHaveBeenCalledWith(`/admin/plans/${PLAN_ID}`);
  });

  it("erreur ou refus ne déclenche aucune revalidation", async () => {
    requirePermission.mockResolvedValue(ACTOR_MANAGE);
    hidePlan.mockRejectedValue(
      new AppError("VALIDATION_ERROR", "Forfait introuvable.", 404),
    );

    await hidePlanAction({ planId: PLAN_ID, reason: "raison valide ici" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("plan-queries — filtre mode Stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
    countSubscribersForPlan.mockResolvedValue({
      active: 2,
      canceled: 0,
      estimatedMonthlyRevenueCents: 1000,
      revenueIsComplete: true,
    });
  });

  it("filtre du mode Stripe présent dans listPlans", async () => {
    planFindMany.mockResolvedValue([]);

    // Utilise l'implémentation réelle (pas le mock actions)
    const { listPlans: realList } = await vi.importActual<
      typeof import("@/features/plans/services/plan-queries")
    >("@/features/plans/services/plan-queries");

    await realList({});

    expect(planFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ stripeMode: "test" }),
      }),
    );
  });

  it("aucun accès cross-mode sur getPlan", async () => {
    planFindFirst.mockResolvedValue(null);

    const { getPlan: realGet } = await vi.importActual<
      typeof import("@/features/plans/services/plan-queries")
    >("@/features/plans/services/plan-queries");

    await expect(realGet({ planId: PLAN_ID })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Forfait introuvable.",
    });

    expect(planFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PLAN_ID, stripeMode: "test" },
      }),
    );
  });
});
