"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { UserRole } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";
import { Button } from "@/components/ui";
import { syncCustomerAction } from "@/features/billing/actions";
import type { BillingActionResult } from "@/features/billing/types";
import type { UserBillingSummary } from "@/features/billing/types";
import { BillingStatusBadge } from "@/features/billing/components/billing-status-badge";
import { StripeModeBadge } from "@/features/billing/components/stripe-mode-badge";
import { CopyableStripeId } from "@/features/billing/components/copyable-stripe-id";
import {
  formatMoneyCents,
  billingIntervalLabel,
} from "@/features/billing/lib/format";

const initial: BillingActionResult | undefined = undefined;

type Props = {
  summary: UserBillingSummary;
  userId: string;
  actorRole: UserRole;
  isLive: boolean;
};

export function UserBillingSection({
  summary,
  userId,
  actorRole,
  isLive,
}: Props) {
  const canSync = hasPermission(actorRole, "billing.sync");
  const canManage =
    hasPermission(actorRole, "billing.subscriptions.cancel") ||
    hasPermission(actorRole, "billing.subscriptions.resume") ||
    hasPermission(actorRole, "billing.refunds.create");
  const canReadSensitive = hasPermission(actorRole, "billing.read_sensitive");

  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, formAction, pending] = useActionState(
    syncCustomerAction,
    initial,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  void isLive;

  return (
    <section className="border-border flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">Facturation</h2>
        {summary.customer ? (
          <StripeModeBadge mode={summary.customer.stripeMode} />
        ) : null}
      </div>

      {!summary.customer && !summary.subscription ? (
        <p className="text-muted-foreground text-sm">
          Aucune donnée de facturation synchronisée.
        </p>
      ) : null}

      {summary.hasPaymentIssue ? (
        <p className="text-destructive text-sm font-medium">
          Problème de paiement détecté.
        </p>
      ) : null}

      {summary.customer ? (
        <div className="text-sm">
          <p className="text-muted-foreground text-xs">Client Stripe</p>
          {canReadSensitive ? (
            <CopyableStripeId value={summary.customer.stripeCustomerId} />
          ) : (
            <code className="text-xs">
              {summary.customer.stripeCustomerId.slice(0, 10)}…
            </code>
          )}
          {summary.customer.dashboardUrl && canManage ? (
            <a
              href={summary.customer.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sebavio-navy dark:text-sebavio-gold ml-2 text-xs underline-offset-2 hover:underline"
            >
              Ouvrir dans Stripe
            </a>
          ) : null}
        </div>
      ) : null}

      {summary.subscription ? (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Abonnement</span>
            <BillingStatusBadge
              kind="subscription"
              status={summary.subscription.status}
            />
          </div>
          <p>
            {formatMoneyCents(
              summary.subscription.unitAmount,
              summary.subscription.currency,
            )}{" "}
            / {billingIntervalLabel(summary.subscription.billingInterval)}
          </p>
          <p className="text-muted-foreground text-xs">
            Renouvellement :{" "}
            {summary.subscription.currentPeriodEnd
              ? new Date(
                  summary.subscription.currentPeriodEnd,
                ).toLocaleDateString("fr-CA")
              : "—"}
            {summary.subscription.cancelAtPeriodEnd
              ? " — annulation planifiée"
              : ""}
          </p>
          {canManage ? (
            <Link
              href={`/admin/subscriptions/${summary.subscription.id}`}
              className="text-sebavio-navy dark:text-sebavio-gold text-xs underline-offset-2 hover:underline"
            >
              Voir l&apos;abonnement
            </Link>
          ) : null}
        </div>
      ) : null}

      {summary.recentPayments.length > 0 ? (
        <div className="text-sm">
          <p className="mb-1 font-medium">Derniers paiements</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {summary.recentPayments.slice(0, 3).map((p) => (
              <li key={p.id}>
                {formatMoneyCents(p.amount, p.currency)} — {p.status} —{" "}
                {new Date(p.createdAt).toLocaleDateString("fr-CA")}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recentInvoices.length > 0 ? (
        <div className="text-sm">
          <p className="mb-1 font-medium">Dernières factures</p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            {summary.recentInvoices.slice(0, 3).map((inv) => (
              <li key={inv.id}>
                {inv.number ?? inv.stripeInvoiceId} —{" "}
                {formatMoneyCents(inv.total, inv.currency)} —{" "}
                {inv.status ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recentRefund ? (
        <p className="text-muted-foreground text-xs">
          Remboursement récent :{" "}
          {formatMoneyCents(
            summary.recentRefund.amount,
            summary.recentRefund.currency,
          )}{" "}
          ({summary.recentRefund.status})
        </p>
      ) : null}

      {summary.lastSyncedAt ? (
        <p className="text-muted-foreground text-[11px]">
          Dernière sync :{" "}
          {new Date(summary.lastSyncedAt).toLocaleString("fr-CA")}
        </p>
      ) : null}

      {canSync ? (
        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="targetType" value="user" />
          <input type="hidden" name="targetId" value={userId} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input
            type="hidden"
            name="reason"
            value="Sync manuelle fiche utilisateur"
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            {pending ? "Sync…" : "Resynchroniser"}
          </Button>
        </form>
      ) : null}
    </section>
  );
}
