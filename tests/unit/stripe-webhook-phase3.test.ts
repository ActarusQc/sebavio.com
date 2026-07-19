import { createHmac } from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Tests webhook : signature, hash, sanitization — sans appels réseau Stripe.
 */

function signStripePayload(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
): string {
  const signed = `${timestamp}.${payload}`;
  const digest = createHmac("sha256", secret).update(signed).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

describe("Stripe webhook signature helpers", () => {
  const secret = "whsec_test_secret_for_unit_tests_only";
  const payload = JSON.stringify({
    id: "evt_test_123",
    object: "event",
    type: "customer.updated",
    data: { object: { id: "cus_test" } },
  });

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_51ExampleSecretKeyForUnitTests";
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    process.env.STRIPE_MODE = "test";
    vi.resetModules();
  });

  it("accepte une signature valide", async () => {
    const { verifyStripeWebhookSignature } =
      await import("@/services/stripe/webhook-service");
    const header = signStripePayload(payload, secret);
    const event = verifyStripeWebhookSignature(payload, header);
    expect(event.id).toBe("evt_test_123");
    expect(event.type).toBe("customer.updated");
  });

  it("refuse une signature invalide", async () => {
    const { verifyStripeWebhookSignature } =
      await import("@/services/stripe/webhook-service");
    const { StripeWebhookSignatureError } =
      await import("@/services/stripe/errors");
    expect(() =>
      verifyStripeWebhookSignature(payload, "t=1,v1=deadbeef"),
    ).toThrow(StripeWebhookSignatureError);
  });

  it("refuse un en-tête manquant", async () => {
    const { verifyStripeWebhookSignature } =
      await import("@/services/stripe/webhook-service");
    const { StripeWebhookSignatureError } =
      await import("@/services/stripe/errors");
    expect(() => verifyStripeWebhookSignature(payload, null)).toThrow(
      StripeWebhookSignatureError,
    );
  });

  it("échoue si le corps a été altéré après signature", async () => {
    const { verifyStripeWebhookSignature } =
      await import("@/services/stripe/webhook-service");
    const { StripeWebhookSignatureError } =
      await import("@/services/stripe/errors");
    const header = signStripePayload(payload, secret);
    const tampered = payload.replace("cus_test", "cus_other");
    expect(() => verifyStripeWebhookSignature(tampered, header)).toThrow(
      StripeWebhookSignatureError,
    );
  });
});

describe("billing list query schemas", () => {
  it("valide et normalise les paramètres d'abonnement", async () => {
    const { subscriptionListQuerySchema } =
      await import("@/features/billing/schemas");
    const parsed = subscriptionListQuerySchema.parse({
      page: "2",
      status: "active",
      stripeMode: "test",
      q: "alice@example.com",
    });
    expect(parsed.page).toBe(2);
    expect(parsed.status).toBe("active");
    expect(parsed.stripeMode).toBe("test");
  });

  it("rejette un statut inconnu", async () => {
    const { subscriptionListQuerySchema } =
      await import("@/features/billing/schemas");
    expect(() =>
      subscriptionListQuerySchema.parse({ status: "not_a_status" }),
    ).toThrow();
  });
});
