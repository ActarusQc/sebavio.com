export const BILLING_LIST_DEFAULT_PAGE_SIZE = 20;
export const BILLING_LIST_MAX_PAGE_SIZE = 100;
export const BILLING_EXPORT_MAX_ROWS = 5000;

export const SUBSCRIPTION_STATUSES = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
] as const;

export const PAYMENT_STATUSES = [
  "succeeded",
  "processing",
  "requires_payment_method",
  "requires_action",
  "requires_confirmation",
  "canceled",
  "failed",
  "partially_refunded",
  "refunded",
] as const;

export const INVOICE_STATUSES = [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
] as const;

export const WEBHOOK_STATUSES = [
  "received",
  "processing",
  "processed",
  "ignored",
  "failed",
] as const;

export const STRIPE_MODES = ["test", "live"] as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  incomplete: "Incomplet",
  incomplete_expired: "Incomplet expiré",
  trialing: "Essai",
  active: "Actif",
  past_due: "En retard",
  canceled: "Annulé",
  unpaid: "Impayé",
  paused: "En pause",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  succeeded: "Réussi",
  processing: "En traitement",
  requires_payment_method: "Moyen requis",
  requires_action: "Action requise",
  requires_confirmation: "Confirmation requise",
  canceled: "Annulé",
  failed: "Échoué",
  partially_refunded: "Remboursé partiellement",
  refunded: "Remboursé",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  open: "Ouverte",
  paid: "Payée",
  uncollectible: "Irrécouvrable",
  void: "Annulée",
};

export const WEBHOOK_STATUS_LABELS: Record<string, string> = {
  received: "Reçu",
  processing: "En traitement",
  processed: "Traité",
  ignored: "Ignoré",
  failed: "Échoué",
};

export const STRIPE_MODE_LABELS: Record<string, string> = {
  test: "Test",
  live: "Live",
};

export const BILLING_INTERVAL_LABELS: Record<string, string> = {
  day: "Jour",
  week: "Semaine",
  month: "Mois",
  year: "Année",
};

export const REFUND_STRIPE_REASONS = [
  "duplicate",
  "fraudulent",
  "requested_by_customer",
] as const;

export const REFUND_STRIPE_REASON_LABELS: Record<string, string> = {
  duplicate: "Doublon",
  fraudulent: "Fraude",
  requested_by_customer: "Demande du client",
};

export const SUBSCRIPTION_LIST_SORTS = [
  "createdAt",
  "currentPeriodEnd",
  "unitAmount",
  "lastSyncedAt",
  "status",
] as const;

export const PAYMENT_LIST_SORTS = [
  "createdAt",
  "amount",
  "paidAt",
  "lastSyncedAt",
  "status",
] as const;

export const INVOICE_LIST_SORTS = [
  "createdAt",
  "total",
  "dueDate",
  "paidAt",
  "lastSyncedAt",
] as const;

export const WEBHOOK_LIST_SORTS = [
  "receivedAt",
  "processedAt",
  "attemptCount",
  "type",
] as const;

export const SUBSCRIPTION_SORT_LABELS: Record<string, string> = {
  createdAt: "Création",
  currentPeriodEnd: "Renouvellement",
  unitAmount: "Montant",
  lastSyncedAt: "Dernière sync",
  status: "Statut",
};

export const PAYMENT_SORT_LABELS: Record<string, string> = {
  createdAt: "Date",
  amount: "Montant",
  paidAt: "Payé le",
  lastSyncedAt: "Dernière sync",
  status: "Statut",
};

export const INVOICE_SORT_LABELS: Record<string, string> = {
  createdAt: "Création",
  total: "Total",
  dueDate: "Échéance",
  paidAt: "Payée le",
  lastSyncedAt: "Dernière sync",
};

export const WEBHOOK_SORT_LABELS: Record<string, string> = {
  receivedAt: "Réception",
  processedAt: "Traitement",
  attemptCount: "Tentatives",
  type: "Type",
};
