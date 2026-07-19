export type StripeMode = "test" | "live";

export type BillingListResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type SubscriptionListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
  status: string;
  currency: string | null;
  unitAmount: number | null;
  billingInterval: string | null;
  quantity: number;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  trialEnd: string | null;
  stripeMode: StripeMode;
  lastSyncedAt: string | null;
  createdAt: string;
};

export type SubscriptionDetail = SubscriptionListItem & {
  canceledAt: string | null;
  trialStart: string | null;
  endedAt: string | null;
  latestInvoiceId: string | null;
  stripeUpdatedAt: string | null;
  dashboardUrl: string | null;
  customerDashboardUrl: string | null;
  recentPayments: PaymentListItem[];
  recentInvoices: InvoiceListItem[];
};

export type PaymentListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  stripeCustomerId: string | null;
  stripePaymentIntentId: string;
  stripeChargeId: string | null;
  stripeInvoiceId: string | null;
  amount: number;
  amountReceived: number;
  amountRefunded: number;
  currency: string;
  status: string;
  failureMessageSafe: string | null;
  paymentMethodType: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  stripeMode: StripeMode;
  paidAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  refundableAmount: number;
};

export type InvoiceListItem = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  stripeInvoiceId: string;
  stripeSubscriptionId: string | null;
  number: string | null;
  status: string | null;
  currency: string | null;
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  amountRemaining: number;
  hostedInvoiceUrl: string | null;
  invoicePdfUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  stripeMode: StripeMode;
  lastSyncedAt: string | null;
  createdAt: string;
};

export type WebhookListItem = {
  id: string;
  stripeEventId: string;
  stripeMode: StripeMode;
  type: string;
  objectId: string | null;
  status: string;
  attemptCount: number;
  receivedAt: string;
  processingStartedAt: string | null;
  processedAt: string | null;
  lastErrorCode: string | null;
  lastErrorSafe: string | null;
  nextRetryAt: string | null;
};

export type UserBillingSummary = {
  customer: {
    id: string;
    stripeCustomerId: string;
    stripeMode: StripeMode;
    emailSnapshot: string | null;
    lastSyncedAt: string | null;
    dashboardUrl: string | null;
  } | null;
  subscription: SubscriptionListItem | null;
  recentPayments: PaymentListItem[];
  recentInvoices: InvoiceListItem[];
  recentRefund: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  } | null;
  hasPaymentIssue: boolean;
  lastSyncedAt: string | null;
};

export type BillingActionResult = {
  ok: boolean;
  message: string;
};
