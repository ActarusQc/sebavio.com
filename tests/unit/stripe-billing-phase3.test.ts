import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { loadStripeConfig, isStripeConfigured } from "@/services/stripe/config";
import { buildDashboardUrl } from "@/services/stripe/dashboard-urls";
import { maskStripeId, sanitizeStripeMessage } from "@/services/stripe/mask";
import {
  StripeModeMismatchError,
  StripeNotConfiguredError,
} from "@/services/stripe/errors";
import {
  cancelLiveConfirmationPhrase,
  refundLiveConfirmationPhrase,
  isLiveConfirmationValid,
} from "@/features/billing/lib/live-confirmation";
import { neutralizeCsvFormula, csvCell } from "@/features/admin/lib/csv";
import { hasPermission } from "@/lib/rbac";

describe("Stripe config", () => {
  const base = {
    STRIPE_SECRET_KEY: "sk_test_51ExampleSecretKeyForUnitTests",
    STRIPE_WEBHOOK_SECRET: "whsec_exampleWebhookSecretForUnitTests",
    STRIPE_MODE: "test",
  };

  it("refuse une configuration absente", () => {
    expect(() => loadStripeConfig({})).toThrow(StripeNotConfiguredError);
    expect(isStripeConfigured({})).toBe(false);
  });

  it("charge le mode test avec clé sk_test_", () => {
    const cfg = loadStripeConfig({ ...base });
    expect(cfg.mode).toBe("test");
    expect(cfg.secretKey.startsWith("sk_test_")).toBe(true);
    expect(isStripeConfigured(base)).toBe(true);
  });

  it("charge le mode live avec clé sk_live_", () => {
    const cfg = loadStripeConfig({
      STRIPE_SECRET_KEY: "sk_live_51ExampleSecretKeyForUnitTests",
      STRIPE_WEBHOOK_SECRET: "whsec_exampleWebhookSecretForUnitTests",
      STRIPE_MODE: "live",
    });
    expect(cfg.mode).toBe("live");
  });

  it("refuse un décalage mode/clé", () => {
    expect(() =>
      loadStripeConfig({
        ...base,
        STRIPE_MODE: "live",
      }),
    ).toThrow(StripeModeMismatchError);
  });

  it("ne déduit pas le mode uniquement depuis la clé", () => {
    expect(() =>
      loadStripeConfig({
        STRIPE_SECRET_KEY: "sk_test_51Example",
        STRIPE_WEBHOOK_SECRET: "whsec_x",
        // STRIPE_MODE manquant
      }),
    ).toThrow(StripeNotConfiguredError);
  });
});

describe("Stripe dashboard URLs", () => {
  it("utilise /test en mode test", () => {
    expect(buildDashboardUrl("test", "customer", "cus_123")).toBe(
      "https://dashboard.stripe.com/test/customers/cus_123",
    );
  });

  it("utilise la racine live sans /test", () => {
    expect(buildDashboardUrl("live", "subscription", "sub_abc")).toBe(
      "https://dashboard.stripe.com/subscriptions/sub_abc",
    );
  });

  it("encode les identifiants", () => {
    const url = buildDashboardUrl("test", "event", "evt_a/b");
    expect(url).toContain("evt_a%2Fb");
  });
});

describe("Stripe mask / sanitize", () => {
  it("masque les identifiants longs", () => {
    expect(maskStripeId("cus_abcdefghijklmnop")).toMatch(/^cus_ab…/);
  });

  it("redacte secrets et numéros de carte dans les messages", () => {
    const raw = "fail sk_test_ABC123 whsec_SECRETXYZ card 4242424242424242";
    const clean = sanitizeStripeMessage(raw);
    expect(clean).not.toContain("sk_test_ABC123");
    expect(clean).not.toContain("whsec_SECRETXYZ");
    expect(clean).not.toContain("4242424242424242");
    expect(clean).toContain("sk_***");
    expect(clean).toContain("[card_redacted]");
  });
});

describe("Confirmations Live", () => {
  it("génère la phrase d'annulation", () => {
    expect(cancelLiveConfirmationPhrase("a@b.com")).toBe("ANNULER a@b.com");
  });

  it("génère la phrase de remboursement", () => {
    expect(refundLiveConfirmationPhrase("49.99", "cad")).toBe(
      "REMBOURSER 49.99 CAD",
    );
  });

  it("exige la confirmation exacte en Live", () => {
    expect(
      isLiveConfirmationValid("ANNULER x@y.com", "ANNULER x@y.com", true),
    ).toBe(true);
    expect(isLiveConfirmationValid("ANNULER x@y.com", "", true)).toBe(false);
    expect(isLiveConfirmationValid("ANNULER x@y.com", "", false)).toBe(true);
  });
});

describe("Export CSV billing", () => {
  it("neutralise les formules CSV", () => {
    expect(neutralizeCsvFormula("=1+1")).toBe("'=1+1");
    expect(csvCell("+cmd")).toBe("'+cmd");
  });
});

describe("RBAC billing Phase 3", () => {
  it("SUPPORT a billing.read mais pas refund/cancel/webhooks", () => {
    expect(hasPermission("support", "billing.read")).toBe(true);
    expect(hasPermission("support", "billing.refunds.create")).toBe(false);
    expect(hasPermission("support", "billing.subscriptions.cancel")).toBe(
      false,
    );
    expect(hasPermission("support", "billing.webhooks.read")).toBe(false);
    expect(hasPermission("support", "billing.payments.read")).toBe(false);
  });

  it("ANALYST n'a pas d'accès nominatif paiements", () => {
    expect(hasPermission("analyst", "billing.read")).toBe(false);
    expect(hasPermission("analyst", "billing.payments.read")).toBe(false);
  });

  it("BILLING_ADMIN a les permissions granulaires", () => {
    expect(hasPermission("billing_admin", "billing.sync")).toBe(true);
    expect(hasPermission("billing_admin", "billing.refunds.create")).toBe(true);
    expect(hasPermission("billing_admin", "billing.webhooks.retry")).toBe(true);
    expect(hasPermission("billing_admin", "billing.export")).toBe(true);
  });

  it("alias billing.manage / billing.refund", () => {
    expect(hasPermission("billing_admin", "billing.manage")).toBe(true);
    expect(hasPermission("billing_admin", "billing.refund")).toBe(true);
  });
});

describe("getStripeClient ne fuit pas le secret", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.STRIPE_SECRET_KEY = "sk_test_51ExampleSecretKeyForUnitTests";
    process.env.STRIPE_WEBHOOK_SECRET =
      "whsec_exampleWebhookSecretForUnitTests";
    process.env.STRIPE_MODE = "test";
  });

  afterEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_MODE;
  });

  it("retourne un client sans exposer la clé dans les propriétés inspectables", async () => {
    const { getStripeClient } = await import("@/services/stripe/client");
    const client = getStripeClient();
    expect(client).toBeTruthy();
    const asRecord = client as unknown as Record<string, unknown>;
    expect(asRecord.secretKey).toBeUndefined();
    expect(
      JSON.stringify({ apiVersion: client.getApiField?.("version") }),
    ).not.toContain("sk_test_");
    // La clé vit dans un champ privé du SDK — vérifier qu'elle n'est pas une prop publique
    for (const key of Object.keys(client)) {
      const value = (client as unknown as Record<string, unknown>)[key];
      if (typeof value === "string") {
        expect(value).not.toContain("sk_test_51ExampleSecretKeyForUnitTests");
      }
    }
  });
});
