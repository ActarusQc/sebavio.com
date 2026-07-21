import { describe, expect, it, vi } from "vitest";

const { getStripeMode, retrieveSebavioProduct, pricesCreate } = vi.hoisted(
  () => ({
    getStripeMode: vi.fn(),
    retrieveSebavioProduct: vi.fn(),
    pricesCreate: vi.fn(),
  }),
);

vi.mock("@/services/stripe/config", () => ({ getStripeMode }));
vi.mock("@/services/stripe/product-service", () => ({
  retrieveSebavioProduct,
}));
vi.mock("@/services/stripe/client", () => ({
  getStripeClient: () => ({
    prices: { create: pricesCreate },
  }),
}));

import {
  OFFICIAL_CURRENCY,
  OFFICIAL_PLAN_SLUGS,
  PASS_DURATION_DAYS,
  PASS_PRICE_CENTS,
  PLUS_PRICE_CENTS,
} from "@/features/subscriptions/lib/official-plan-slugs";
import { createSebavioOneTimePrice } from "@/services/stripe/price-service";
import { buildSebavioOneTimeMetadata } from "@/services/stripe/sebavio-metadata";

describe("official plans — constantes", () => {
  it("expose les slugs officiels stables", () => {
    expect(OFFICIAL_PLAN_SLUGS.DECOUVERTE).toBe("decouverte");
    expect(OFFICIAL_PLAN_SLUGS.PASS_30_JOURS).toBe("pass-30-jours");
    expect(OFFICIAL_PLAN_SLUGS.SEBAVIO_PLUS).toBe("sebavio-plus");
  });

  it("fixe prix et durée Pass / Plus", () => {
    expect(PASS_DURATION_DAYS).toBe(30);
    expect(PASS_PRICE_CENTS).toBe(1299);
    expect(PLUS_PRICE_CENTS).toBe(6999);
    expect(OFFICIAL_CURRENCY).toBe("cad");
  });
});

describe("createSebavioOneTimePrice — forme sans recurring", () => {
  it("n’envoie pas de champ recurring à Stripe", async () => {
    getStripeMode.mockReturnValue("test");
    retrieveSebavioProduct.mockResolvedValue({ id: "prod_1" });
    pricesCreate.mockResolvedValue({
      id: "price_1",
      livemode: false,
      metadata: {},
    });

    const planId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    await createSebavioOneTimePrice({
      productId: "prod_1",
      planId,
      planSlug: OFFICIAL_PLAN_SLUGS.PASS_30_JOURS,
      unitAmount: PASS_PRICE_CENTS,
      currency: OFFICIAL_CURRENCY,
      accessDurationDays: PASS_DURATION_DAYS,
      idempotencyKey: "idem-1",
    });

    expect(pricesCreate).toHaveBeenCalledTimes(1);
    const [params] = pricesCreate.mock.calls[0] as [
      Record<string, unknown>,
      { idempotencyKey: string },
    ];
    expect(params).not.toHaveProperty("recurring");
    expect(params.unit_amount).toBe(1299);
    expect(params.currency).toBe("cad");
    expect(params.product).toBe("prod_1");
  });

  it("buildSebavioOneTimeMetadata inclut la durée sans recurring", () => {
    const meta = buildSebavioOneTimeMetadata(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "test",
      {
        planSlug: "pass-30-jours",
        accessDurationDays: 30,
      },
    );
    expect(meta.accessDurationDays).toBe("30");
    expect(meta.accessType).toBe("temporary");
    expect(meta).not.toHaveProperty("recurring");
  });
});
