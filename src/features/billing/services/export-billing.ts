import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { hasPermission } from "@/lib/rbac";
import type { AuthUser } from "@/features/auth/types";
import { csvCell } from "@/features/admin/lib/csv";
import { writeAdminAuditLog } from "@/features/admin/services/audit-write";
import { BILLING_EXPORT_MAX_ROWS } from "@/features/billing/constants";
import type {
  PaymentListQuery,
  SubscriptionListQuery,
} from "@/features/billing/schemas";
import { buildSubscriptionListWhere } from "@/features/billing/services/list-subscriptions";
import { buildPaymentListWhere } from "@/features/billing/services/list-payments";
import {
  displayStatusForPayment,
  formatUserName,
} from "@/features/billing/lib/format";

export type BillingExportResult = {
  csv: string;
  rowCount: number;
  truncated: boolean;
};

type ExportMeta = {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
};

async function auditExport(
  actor: AuthUser,
  kind: "subscriptions" | "payments",
  rowCount: number,
  truncated: boolean,
  filters: Prisma.InputJsonValue,
  meta: ExportMeta,
): Promise<void> {
  await writeAdminAuditLog({
    actorUserId: actor.id,
    actorRole: actor.role,
    entity: "stripe_billing",
    entityId: null,
    action: "STRIPE_BILLING_EXPORTED",
    reason: null,
    newValue: {
      kind,
      rowCount,
      truncated,
      filters,
    },
    ipAddress: meta.ipAddress ?? null,
    userAgent: meta.userAgent ?? null,
    requestId: meta.requestId ?? null,
  });
}

export async function exportSubscriptionsCsv(
  query: Omit<SubscriptionListQuery, "page" | "pageSize">,
  actor: AuthUser,
  meta: ExportMeta = {},
): Promise<BillingExportResult> {
  if (!hasPermission(actor.role, "billing.export")) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  const where = buildSubscriptionListWhere({
    ...query,
    page: 1,
    pageSize: 20,
  });

  const rows = await prisma.stripeSubscription.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: BILLING_EXPORT_MAX_ROWS + 1,
  });

  const truncated = rows.length > BILLING_EXPORT_MAX_ROWS;
  const exportRows = truncated ? rows.slice(0, BILLING_EXPORT_MAX_ROWS) : rows;

  const header = [
    "id",
    "user_id",
    "email",
    "user_name",
    "status",
    "stripe_subscription_id",
    "stripe_customer_id",
    "stripe_price_id",
    "stripe_product_id",
    "currency",
    "unit_amount_cents",
    "billing_interval",
    "quantity",
    "current_period_start",
    "current_period_end",
    "cancel_at_period_end",
    "stripe_mode",
    "last_synced_at",
    "created_at",
  ].join(",");

  const lines = exportRows.map((row) =>
    [
      csvCell(row.id),
      csvCell(row.userId),
      csvCell(row.user.email),
      csvCell(
        formatUserName(
          row.user.profile?.firstName,
          row.user.profile?.lastName,
        ) ?? "",
      ),
      csvCell(row.status),
      csvCell(row.stripeSubscriptionId),
      csvCell(row.stripeCustomerId),
      csvCell(row.stripePriceId),
      csvCell(row.stripeProductId),
      csvCell(row.currency),
      csvCell(row.unitAmount),
      csvCell(row.billingInterval),
      csvCell(row.quantity),
      csvCell(row.currentPeriodStart?.toISOString() ?? ""),
      csvCell(row.currentPeriodEnd?.toISOString() ?? ""),
      csvCell(row.cancelAtPeriodEnd ? "oui" : "non"),
      csvCell(row.stripeMode),
      csvCell(row.lastSyncedAt?.toISOString() ?? ""),
      csvCell(row.createdAt.toISOString()),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");
  await auditExport(
    actor,
    "subscriptions",
    exportRows.length,
    truncated,
    JSON.parse(JSON.stringify(query)) as Prisma.InputJsonValue,
    meta,
  );
  return { csv, rowCount: exportRows.length, truncated };
}

export async function exportPaymentsCsv(
  query: Omit<PaymentListQuery, "page" | "pageSize">,
  actor: AuthUser,
  meta: ExportMeta = {},
): Promise<BillingExportResult> {
  if (!hasPermission(actor.role, "billing.export")) {
    throw new AppError("ADM_001", "Accès refusé", 403);
  }

  const where = buildPaymentListWhere({
    ...query,
    page: 1,
    pageSize: 20,
  });

  const rows = await prisma.stripePayment.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: BILLING_EXPORT_MAX_ROWS + 1,
  });

  const truncated = rows.length > BILLING_EXPORT_MAX_ROWS;
  const exportRows = truncated ? rows.slice(0, BILLING_EXPORT_MAX_ROWS) : rows;

  const header = [
    "id",
    "user_id",
    "email",
    "user_name",
    "status",
    "amount_cents",
    "amount_received_cents",
    "amount_refunded_cents",
    "currency",
    "stripe_payment_intent_id",
    "stripe_charge_id",
    "stripe_invoice_id",
    "payment_method_type",
    "failure_message",
    "stripe_mode",
    "paid_at",
    "last_synced_at",
    "created_at",
  ].join(",");

  const lines = exportRows.map((row) =>
    [
      csvCell(row.id),
      csvCell(row.userId),
      csvCell(row.user.email),
      csvCell(
        formatUserName(
          row.user.profile?.firstName,
          row.user.profile?.lastName,
        ) ?? "",
      ),
      csvCell(displayStatusForPayment(row)),
      csvCell(row.amount),
      csvCell(row.amountReceived),
      csvCell(row.amountRefunded),
      csvCell(row.currency),
      csvCell(row.stripePaymentIntentId),
      csvCell(row.stripeChargeId),
      csvCell(row.stripeInvoiceId),
      csvCell(row.paymentMethodType),
      csvCell(row.failureMessageSafe),
      csvCell(row.stripeMode),
      csvCell(row.paidAt?.toISOString() ?? ""),
      csvCell(row.lastSyncedAt?.toISOString() ?? ""),
      csvCell(row.createdAt.toISOString()),
    ].join(","),
  );

  const csv = [header, ...lines].join("\r\n");
  await auditExport(
    actor,
    "payments",
    exportRows.length,
    truncated,
    JSON.parse(JSON.stringify(query)) as Prisma.InputJsonValue,
    meta,
  );
  return { csv, rowCount: exportRows.length, truncated };
}
