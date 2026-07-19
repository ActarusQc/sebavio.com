import { z } from "zod";
import {
  BILLING_LIST_DEFAULT_PAGE_SIZE,
  INVOICE_LIST_SORTS,
  INVOICE_STATUSES,
  PAYMENT_LIST_SORTS,
  REFUND_STRIPE_REASONS,
  STRIPE_MODES,
  SUBSCRIPTION_LIST_SORTS,
  SUBSCRIPTION_STATUSES,
  WEBHOOK_LIST_SORTS,
  WEBHOOK_STATUSES,
} from "@/features/billing/constants";

const optionalBoolQuery = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    return v === "true" || v === "1";
  });

const reasonSchema = z
  .string()
  .trim()
  .min(3, "Motif trop court (minimum 3 caractères)")
  .max(500);

const pageSizeSchema = z.coerce
  .number()
  .int()
  .default(BILLING_LIST_DEFAULT_PAGE_SIZE)
  .refine((n): n is 20 | 50 | 100 => n === 20 || n === 50 || n === 100, {
    message: "pageSize doit être 20, 50 ou 100",
  });

export const subscriptionListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  stripeMode: z.enum(STRIPE_MODES).optional(),
  stripePriceId: z.string().trim().max(255).optional(),
  stripeProductId: z.string().trim().max(255).optional(),
  trial: optionalBoolQuery,
  cancelAtPeriodEnd: optionalBoolQuery,
  pastDue: optionalBoolQuery,
  renewFrom: z.coerce.date().optional(),
  renewTo: z.coerce.date().optional(),
  sort: z.enum(SUBSCRIPTION_LIST_SORTS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
});

export type SubscriptionListQuery = z.infer<typeof subscriptionListQuerySchema>;

export const paymentListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.string().trim().max(40).optional(),
  stripeMode: z.enum(STRIPE_MODES).optional(),
  amountMin: z.coerce.number().int().min(0).optional(),
  amountMax: z.coerce.number().int().min(0).optional(),
  paidFrom: z.coerce.date().optional(),
  paidTo: z.coerce.date().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  sort: z.enum(PAYMENT_LIST_SORTS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
});

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

export const invoiceListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  stripeMode: z.enum(STRIPE_MODES).optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  sort: z.enum(INVOICE_LIST_SORTS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const webhookListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: z.enum(WEBHOOK_STATUSES).optional(),
  type: z.string().trim().max(120).optional(),
  stripeMode: z.enum(STRIPE_MODES).optional(),
  objectId: z.string().trim().max(255).optional(),
  receivedFrom: z.coerce.date().optional(),
  receivedTo: z.coerce.date().optional(),
  sort: z.enum(WEBHOOK_LIST_SORTS).default("receivedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
});

export type WebhookListQuery = z.infer<typeof webhookListQuerySchema>;

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  mode: z.enum(["at_period_end", "immediately"]),
  reason: reasonSchema,
  confirmation: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export const resumeSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  reason: reasonSchema,
  idempotencyKey: z.string().trim().min(8).max(128),
});

export const createRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amountCents: z.coerce.number().int().positive().optional(),
  full: z.boolean().optional(),
  stripeReason: z.enum(REFUND_STRIPE_REASONS).optional(),
  reason: reasonSchema,
  confirmation: z.string().trim().max(200).optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export const syncBillingSchema = z.object({
  targetType: z.enum([
    "customer",
    "subscription",
    "payment",
    "invoice",
    "user",
  ]),
  targetId: z.string().trim().min(1).max(255),
  reason: reasonSchema.optional(),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export const retryWebhookSchema = z.object({
  webhookEventId: z.string().uuid(),
  reason: reasonSchema,
  idempotencyKey: z.string().trim().min(8).max(128),
  syncObject: z.boolean().optional(),
});
