import type { StripeMode } from "./config";

export type StripeDashboardObjectType =
  "customer" | "subscription" | "payment" | "invoice" | "refund" | "event";

const PATH_BY_TYPE: Record<StripeDashboardObjectType, string> = {
  customer: "customers",
  subscription: "subscriptions",
  payment: "payments",
  invoice: "invoices",
  refund: "payments",
  event: "events",
};

/**
 * Construit une URL Dashboard Stripe pour un objet donné.
 * Les remboursements pointent vers la page paiements (recherche par id).
 */
export function buildDashboardUrl(
  mode: StripeMode,
  objectType: StripeDashboardObjectType,
  id: string,
  accountId?: string | null,
): string {
  const base =
    mode === "live"
      ? "https://dashboard.stripe.com"
      : "https://dashboard.stripe.com/test";

  const path = PATH_BY_TYPE[objectType];
  const accountPrefix =
    accountId && accountId.trim() !== "" ? `/${accountId.trim()}` : "";

  if (objectType === "refund") {
    return `${base}${accountPrefix}/${path}?query=${encodeURIComponent(id)}`;
  }

  return `${base}${accountPrefix}/${path}/${encodeURIComponent(id)}`;
}
