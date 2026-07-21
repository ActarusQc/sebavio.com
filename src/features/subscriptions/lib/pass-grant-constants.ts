/**
 * Constantes / types Pass admin — utilisables côté client et serveur.
 */

export const PASS_GRANT_STATUSES = [
  "pending_payment",
  "active",
  "expired",
  "refunded",
  "revoked",
  "payment_failed",
] as const;

export type PassGrantStatus = (typeof PASS_GRANT_STATUSES)[number];

export const PASS_GRANT_STATUS_LABELS: Record<PassGrantStatus, string> = {
  pending_payment: "Paiement en attente",
  active: "Actif",
  expired: "Expiré",
  refunded: "Remboursé",
  revoked: "Révoqué",
  payment_failed: "Paiement échoué",
};

export const PASS_ADMIN_DEFAULT_PAGE_SIZE = 20;

export type PassGrantListItem = {
  id: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  remainingDays: number;
  stripeMode: string;
  createdAt: Date;
  userId: string;
  userEmail: string;
  userName: string | null;
  planId: string;
  planPublicName: string;
  planInternalName: string;
  sourcePurchaseId: string | null;
  sourcePurchaseStatus: string | null;
};

export type PassGrantListResult = {
  items: PassGrantListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PassGrantDetail = PassGrantListItem & {
  revokedAt: Date | null;
  revokedReason: string | null;
  revokedByAdminId: string | null;
  revokedByAdminEmail: string | null;
  lastAdminExtendAt: Date | null;
  lastAdminExtendById: string | null;
  lastAdminExtendByEmail: string | null;
  lastAdminExtendDays: number | null;
  lastAdminExtendReason: string | null;
  lastExtensionEventId: string | null;
  sourcePurchase: {
    id: string;
    status: string;
    amountCents: number;
    currency: string;
    paidAt: Date | null;
    stripeCheckoutSessionId: string | null;
    stripePaymentIntentId: string | null;
  } | null;
};
