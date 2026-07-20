import { beforeEach, describe, expect, it, vi } from "vitest";

import type Stripe from "stripe";

const {
  mockGetStripeClient,
  mockGetStripeMode,
  productsCreate,
  productsRetrieve,
  productsUpdate,
  productsList,
  pricesCreate,
  pricesRetrieve,
  pricesUpdate,
  pricesList,
} = vi.hoisted(() => ({
  mockGetStripeClient: vi.fn(),
  mockGetStripeMode: vi.fn((): "test" | "live" => "test"),
  productsCreate: vi.fn(),
  productsRetrieve: vi.fn(),
  productsUpdate: vi.fn(),
  productsList: vi.fn(),
  pricesCreate: vi.fn(),
  pricesRetrieve: vi.fn(),
  pricesUpdate: vi.fn(),
  pricesList: vi.fn(),
}));

vi.mock("@/services/stripe/client", () => ({
  getStripeClient: mockGetStripeClient,
  STRIPE_API_VERSION: "2026-06-24.dahlia",
}));

vi.mock("@/services/stripe/config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/services/stripe/config")>();
  return {
    ...actual,
    getStripeMode: mockGetStripeMode,
  };
});

import {
  StripeModeMismatchError,
  StripeObjectNotFoundError,
  StripeSebavioProductError,
} from "@/services/stripe/errors";
import {
  archiveStripeProduct,
  createSebavioProduct,
  listSebavioProducts,
  retrieveSebavioProduct,
  updateSebavioProductMetadata,
} from "@/services/stripe/product-service";
import {
  createSebavioPrice,
  deactivateStripePrice,
  listPricesForProduct,
  retrieveSebavioPrice,
} from "@/services/stripe/price-service";

const PLAN_ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
const OTHER_PLAN_ID = "b2c3d4e5-f6a7-4890-b123-456789abcdef";

function baseProduct(
  overrides: Partial<Stripe.Product> & { id?: string } = {},
): Stripe.Product {
  return {
    id: "prod_test_1",
    object: "product",
    active: true,
    created: 1_700_000_000,
    default_price: null,
    description: null,
    images: [],
    livemode: false,
    marketing_features: [],
    metadata: {
      sebavio_app: "sebavio",
      sebavio_plan_id: PLAN_ID,
      sebavio_stripe_mode: "test",
    },
    name: "Forfait Pro",
    package_dimensions: null,
    shippable: null,
    statement_descriptor: null,
    tax_code: null,
    type: "service",
    unit_label: null,
    updated: 1_700_000_000,
    url: null,
    ...overrides,
  } as Stripe.Product;
}

function basePrice(
  overrides: Partial<Stripe.Price> & { id?: string } = {},
): Stripe.Price {
  return {
    id: "price_test_1",
    object: "price",
    active: true,
    billing_scheme: "per_unit",
    created: 1_700_000_100,
    currency: "cad",
    custom_unit_amount: null,
    livemode: false,
    lookup_key: null,
    metadata: {
      sebavio_app: "sebavio",
      sebavio_plan_id: PLAN_ID,
      sebavio_stripe_mode: "test",
    },
    nickname: null,
    product: "prod_test_1",
    recurring: {
      interval: "month",
      interval_count: 1,
      meter: null,
      trial_period_days: null,
      usage_type: "licensed",
    },
    tax_behavior: "unspecified",
    tiers_mode: null,
    transform_quantity: null,
    type: "recurring",
    unit_amount: 1999,
    unit_amount_decimal: "1999",
    ...overrides,
  } as Stripe.Price;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStripeMode.mockReturnValue("test");
  mockGetStripeClient.mockReturnValue({
    products: {
      create: productsCreate,
      retrieve: productsRetrieve,
      update: productsUpdate,
      list: productsList,
    },
    prices: {
      create: pricesCreate,
      retrieve: pricesRetrieve,
      update: pricesUpdate,
      list: pricesList,
    },
  });
});

describe("createSebavioProduct", () => {
  it("crée un produit actif avec toutes les métadonnées Sebavio", async () => {
    const created = baseProduct();
    productsCreate.mockResolvedValue(created);

    const result = await createSebavioProduct({
      name: "Forfait Pro",
      description: "Desc",
      planId: PLAN_ID,
      idempotencyKey: "plan-create:abc:product",
    });

    expect(result).toEqual(created);
    expect(productsCreate).toHaveBeenCalledWith(
      {
        name: "Forfait Pro",
        description: "Desc",
        active: true,
        metadata: {
          sebavio_app: "sebavio",
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "test",
        },
      },
      { idempotencyKey: "plan-create:abc:product" },
    );
  });

  it("passe l'idempotencyKey exact dans les options", async () => {
    productsCreate.mockResolvedValue(baseProduct());
    const key = "exact-idempotency-key-42";
    await createSebavioProduct({
      name: "X",
      planId: PLAN_ID,
      idempotencyKey: key,
    });
    expect(productsCreate.mock.calls[0][1]).toEqual({ idempotencyKey: key });
  });

  it("utilise sebavio_stripe_mode=test en mode test", async () => {
    mockGetStripeMode.mockReturnValue("test");
    productsCreate.mockResolvedValue(baseProduct());
    await createSebavioProduct({
      name: "X",
      planId: PLAN_ID,
      idempotencyKey: "k",
    });
    expect(productsCreate.mock.calls[0][0].metadata.sebavio_stripe_mode).toBe(
      "test",
    );
  });

  it("utilise sebavio_stripe_mode=live en mode live", async () => {
    mockGetStripeMode.mockReturnValue("live");
    productsCreate.mockResolvedValue(
      baseProduct({
        livemode: true,
        metadata: {
          sebavio_app: "sebavio",
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "live",
        },
      }),
    );
    await createSebavioProduct({
      name: "X",
      planId: PLAN_ID,
      idempotencyKey: "k",
    });
    expect(productsCreate.mock.calls[0][0].metadata.sebavio_stripe_mode).toBe(
      "live",
    );
  });
});

describe("retrieveSebavioProduct", () => {
  it("rejette un produit en mauvais mode", async () => {
    mockGetStripeMode.mockReturnValue("test");
    productsRetrieve.mockResolvedValue(baseProduct({ livemode: true }));
    await expect(retrieveSebavioProduct("prod_test_1")).rejects.toThrow(
      StripeModeMismatchError,
    );
  });

  it("rejette un produit sans sebavio_app", async () => {
    productsRetrieve.mockResolvedValue(
      baseProduct({
        metadata: {
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "test",
        },
      }),
    );
    await expect(retrieveSebavioProduct("prod_test_1")).rejects.toThrow(
      StripeSebavioProductError,
    );
  });

  it("rejette un planId attendu incorrect", async () => {
    productsRetrieve.mockResolvedValue(baseProduct());
    await expect(
      retrieveSebavioProduct("prod_test_1", {
        expectedPlanId: OTHER_PLAN_ID,
      }),
    ).rejects.toThrow(/autre forfait|plan/i);
  });

  it("accepte un produit Sebavio valide", async () => {
    const product = baseProduct();
    productsRetrieve.mockResolvedValue(product);
    await expect(retrieveSebavioProduct("prod_test_1")).resolves.toEqual(
      product,
    );
  });
});

describe("updateSebavioProductMetadata", () => {
  it("fusionne les métadonnées sans écraser les autres clés", async () => {
    productsRetrieve.mockResolvedValue(
      baseProduct({
        metadata: {
          sebavio_app: "sebavio",
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "test",
          custom_key: "keep-me",
        },
      }),
    );
    productsUpdate.mockResolvedValue(baseProduct({ name: "Nouveau" }));

    await updateSebavioProductMetadata("prod_test_1", {
      name: "Nouveau",
      description: "D",
    });

    expect(productsUpdate).toHaveBeenCalledWith("prod_test_1", {
      name: "Nouveau",
      description: "D",
      metadata: {
        sebavio_app: "sebavio",
        sebavio_plan_id: PLAN_ID,
        sebavio_stripe_mode: "test",
        custom_key: "keep-me",
      },
    });
  });
});

describe("archiveStripeProduct", () => {
  it("n'envoie que active:false (aucun champ financier)", async () => {
    productsRetrieve.mockResolvedValue(baseProduct());
    productsUpdate.mockResolvedValue(baseProduct({ active: false }));

    await archiveStripeProduct("prod_test_1");

    expect(productsUpdate).toHaveBeenCalledTimes(1);
    expect(productsUpdate).toHaveBeenCalledWith("prod_test_1", {
      active: false,
    });
    const payload = productsUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("unit_amount");
    expect(payload).not.toHaveProperty("currency");
    expect(payload).not.toHaveProperty("default_price");
    expect(Object.keys(payload)).toEqual(["active"]);
  });
});

describe("listSebavioProducts", () => {
  it("pagine toutes les pages via starting_after", async () => {
    const p1 = baseProduct({ id: "prod_1", created: 100 });
    const p2 = baseProduct({ id: "prod_2", created: 200 });
    productsList
      .mockResolvedValueOnce({
        data: [p1],
        has_more: true,
        object: "list",
      })
      .mockResolvedValueOnce({
        data: [p2],
        has_more: false,
        object: "list",
      });

    const result = await listSebavioProducts();
    expect(result).toHaveLength(2);
    expect(productsList).toHaveBeenCalledTimes(2);
    expect(productsList.mock.calls[0][0]).toMatchObject({ limit: 100 });
    expect(productsList.mock.calls[1][0]).toMatchObject({
      starting_after: "prod_1",
    });
  });

  it("exclut les produits non Sebavio et du mauvais mode", async () => {
    productsList.mockResolvedValue({
      data: [
        baseProduct({ id: "prod_ok" }),
        baseProduct({
          id: "prod_other_app",
          metadata: {
            sebavio_app: "other",
            sebavio_plan_id: PLAN_ID,
            sebavio_stripe_mode: "test",
          },
        }),
        baseProduct({
          id: "prod_live_meta",
          metadata: {
            sebavio_app: "sebavio",
            sebavio_plan_id: PLAN_ID,
            sebavio_stripe_mode: "live",
          },
        }),
      ],
      has_more: false,
      object: "list",
    });

    const result = await listSebavioProducts();
    expect(result.map((p) => p.id)).toEqual(["prod_ok"]);
  });
});

describe("createSebavioPrice", () => {
  beforeEach(() => {
    productsRetrieve.mockResolvedValue(baseProduct());
  });

  it("crée un prix avec unit_amount entier et recurring", async () => {
    pricesCreate.mockResolvedValue(basePrice());

    await createSebavioPrice({
      productId: "prod_test_1",
      planId: PLAN_ID,
      unitAmount: 1999,
      currency: "cad",
      interval: "month",
      intervalCount: 1,
      idempotencyKey: "plan-create:abc:price:month:1:cad",
    });

    expect(pricesCreate).toHaveBeenCalledWith(
      {
        product: "prod_test_1",
        unit_amount: 1999,
        currency: "cad",
        recurring: { interval: "month", interval_count: 1 },
        metadata: {
          sebavio_app: "sebavio",
          sebavio_plan_id: PLAN_ID,
          sebavio_stripe_mode: "test",
        },
      },
      { idempotencyKey: "plan-create:abc:price:month:1:cad" },
    );
  });

  it("passe l'idempotencyKey exact pour le prix", async () => {
    pricesCreate.mockResolvedValue(basePrice());
    const key = "price-key-exact";
    await createSebavioPrice({
      productId: "prod_test_1",
      planId: PLAN_ID,
      unitAmount: 100,
      currency: "cad",
      interval: "year",
      intervalCount: 1,
      idempotencyKey: key,
    });
    expect(pricesCreate.mock.calls[0][1]).toEqual({ idempotencyKey: key });
  });

  it("rejette un montant négatif", async () => {
    await expect(
      createSebavioPrice({
        productId: "prod_test_1",
        planId: PLAN_ID,
        unitAmount: -1,
        currency: "cad",
        interval: "month",
        intervalCount: 1,
        idempotencyKey: "k",
      }),
    ).rejects.toThrow(/montant/i);
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("rejette un montant décimal (float)", async () => {
    await expect(
      createSebavioPrice({
        productId: "prod_test_1",
        planId: PLAN_ID,
        unitAmount: 19.99,
        currency: "cad",
        interval: "month",
        intervalCount: 1,
        idempotencyKey: "k",
      }),
    ).rejects.toThrow(/montant/i);
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("rejette intervalCount 0, négatif ou décimal", async () => {
    for (const intervalCount of [0, -1, 1.5]) {
      await expect(
        createSebavioPrice({
          productId: "prod_test_1",
          planId: PLAN_ID,
          unitAmount: 100,
          currency: "cad",
          interval: "month",
          intervalCount,
          idempotencyKey: "k",
        }),
      ).rejects.toThrow();
    }
    expect(pricesCreate).not.toHaveBeenCalled();
  });

  it("vérifie que le produit appartient au même plan", async () => {
    productsRetrieve.mockResolvedValue(baseProduct());
    await expect(
      createSebavioPrice({
        productId: "prod_test_1",
        planId: OTHER_PLAN_ID,
        unitAmount: 100,
        currency: "cad",
        interval: "month",
        intervalCount: 1,
        idempotencyKey: "k",
      }),
    ).rejects.toThrow(/autre forfait|plan/i);
    expect(pricesCreate).not.toHaveBeenCalled();
  });
});

describe("retrieveSebavioPrice", () => {
  it("rejette un prix en mauvais mode", async () => {
    mockGetStripeMode.mockReturnValue("test");
    pricesRetrieve.mockResolvedValue(basePrice({ livemode: true }));
    await expect(retrieveSebavioPrice("price_test_1")).rejects.toThrow(
      StripeModeMismatchError,
    );
  });

  it("accepte product comme id string", async () => {
    pricesRetrieve.mockResolvedValue(basePrice({ product: "prod_test_1" }));
    const price = await retrieveSebavioPrice("price_test_1");
    expect(price.product).toBe("prod_test_1");
  });

  it("accepte product comme objet expansé", async () => {
    pricesRetrieve.mockResolvedValue(
      basePrice({
        product: baseProduct({ id: "prod_expanded" }) as unknown as string,
      }),
    );
    const price = await retrieveSebavioPrice("price_test_1", {
      expectedPlanId: PLAN_ID,
    });
    expect(price).toBeTruthy();
  });
});

describe("deactivateStripePrice", () => {
  it("n'envoie que active:false — aucun champ financier", async () => {
    pricesRetrieve.mockResolvedValue(basePrice());
    pricesUpdate.mockResolvedValue(basePrice({ active: false }));

    await deactivateStripePrice("price_test_1");

    expect(pricesUpdate).toHaveBeenCalledWith("price_test_1", {
      active: false,
    });
    const payload = pricesUpdate.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("unit_amount");
    expect(payload).not.toHaveProperty("currency");
    expect(payload).not.toHaveProperty("recurring");
    expect(payload).not.toHaveProperty("product");
    expect(Object.keys(payload)).toEqual(["active"]);
  });
});

describe("listPricesForProduct", () => {
  it("pagine toutes les pages et inclut les prix inactifs", async () => {
    productsRetrieve.mockResolvedValue(baseProduct());
    const active = basePrice({ id: "price_a", created: 100, active: true });
    const inactive = basePrice({
      id: "price_b",
      created: 200,
      active: false,
    });
    pricesList
      .mockResolvedValueOnce({
        data: [active],
        has_more: true,
        object: "list",
      })
      .mockResolvedValueOnce({
        data: [inactive],
        has_more: false,
        object: "list",
      });

    const result = await listPricesForProduct("prod_test_1");
    expect(result).toHaveLength(2);
    expect(result.some((p) => !p.active)).toBe(true);
    expect(pricesList).toHaveBeenCalledTimes(2);
    expect(pricesList.mock.calls[0][0]).toMatchObject({
      product: "prod_test_1",
      limit: 100,
    });
    expect(pricesList.mock.calls[0][0].active).toBeUndefined();
    expect(pricesList.mock.calls[1][0]).toMatchObject({
      starting_after: "price_a",
    });
  });

  it("ordonne de façon stable created ASC puis id ASC", async () => {
    productsRetrieve.mockResolvedValue(baseProduct());
    pricesList.mockResolvedValue({
      data: [
        basePrice({ id: "price_z", created: 200 }),
        basePrice({ id: "price_a", created: 100 }),
        basePrice({ id: "price_b", created: 100 }),
      ],
      has_more: false,
      object: "list",
    });

    const result = await listPricesForProduct("prod_test_1");
    expect(result.map((p) => p.id)).toEqual(["price_a", "price_b", "price_z"]);
  });
});

describe("erreurs produit introuvable", () => {
  it("rejette un produit supprimé", async () => {
    productsRetrieve.mockResolvedValue({
      id: "prod_gone",
      object: "product",
      deleted: true,
    });
    await expect(retrieveSebavioProduct("prod_gone")).rejects.toThrow(
      StripeObjectNotFoundError,
    );
  });
});
