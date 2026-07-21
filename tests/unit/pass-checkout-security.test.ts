import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  planFindUnique,
  planPurchaseCreate,
  planPurchaseUpdate,
  getStripeMode,
  getOrCreateStripeCustomer,
  checkoutSessionsCreate,
} = vi.hoisted(() => ({
  planFindUnique: vi.fn(),
  planPurchaseCreate: vi.fn(),
  planPurchaseUpdate: vi.fn(),
  getStripeMode: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
  checkoutSessionsCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findUnique: planFindUnique },
    planPurchase: {
      create: planPurchaseCreate,
      update: planPurchaseUpdate,
    },
  },
}));

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/customer-service", () => ({
  getOrCreateStripeCustomer,
}));
vi.mock("@/services/stripe/client", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: checkoutSessionsCreate } },
  }),
}));

import { createOneTimePassCheckoutSession } from "@/services/stripe/checkout-service";
import { AppError } from "@/lib/errors";

const PLAN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("pass checkout — sécurité", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStripeMode.mockReturnValue("test");
  });

  it("refuse un forfait avec mauvais billingType (recurring)", async () => {
    planFindUnique.mockResolvedValue({
      id: PLAN_ID,
      status: "active",
      stripeMode: "test",
      archivedAt: null,
      isVisibleOnSignup: true,
      stripeProductId: "prod_1",
      internalName: "pass-30-jours",
      prices: [],
    });

    await expect(
      createOneTimePassCheckoutSession({
        userId: USER_ID,
        planId: PLAN_ID,
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).message).toMatch(/prix courant|facturation/i);
      return true;
    });

    expect(planPurchaseCreate).not.toHaveBeenCalled();
    expect(checkoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("refuse un forfait archivé", async () => {
    planFindUnique.mockResolvedValue({
      id: PLAN_ID,
      status: "archived",
      stripeMode: "test",
      archivedAt: new Date("2026-01-01T00:00:00.000Z"),
      isVisibleOnSignup: true,
      stripeProductId: "prod_1",
      internalName: "pass-30-jours",
      prices: [
        {
          id: "price-1",
          stripePriceId: "price_1",
          billingType: "one_time",
          unitAmount: 1299,
          currency: "cad",
          accessDurationDays: 30,
        },
      ],
    });

    await expect(
      createOneTimePassCheckoutSession({
        userId: USER_ID,
        planId: PLAN_ID,
        successUrl: "https://example.com/ok",
        cancelUrl: "https://example.com/cancel",
      }),
    ).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).message).toMatch(/archivé|disponible/i);
      return true;
    });

    expect(planPurchaseCreate).not.toHaveBeenCalled();
  });
});
