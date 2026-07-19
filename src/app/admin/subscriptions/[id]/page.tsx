import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import {
  getSubscriptionDetail,
  BillingStatusBadge,
  StripeModeBadge,
  CopyableStripeId,
  SubscriptionActionsDialog,
  isStripeLiveMode,
  PaymentsTable,
  InvoicesTable,
} from "@/features/billing";
import {
  billingIntervalLabel,
  formatMoneyCents,
} from "@/features/billing/lib/format";
import { syncSubscriptionFormAction } from "@/features/billing/actions";

type Params = Promise<{ id: string }>;

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: Params;
}) {
  const actor = await requirePermission("billing.read");
  const { id } = await params;
  const sub = await getSubscriptionDetail(id);
  const canCancel = hasPermission(actor.role, "billing.subscriptions.cancel");
  const canResume = hasPermission(actor.role, "billing.subscriptions.resume");
  const canSync = hasPermission(actor.role, "billing.sync");
  const canReadSensitive = hasPermission(actor.role, "billing.read_sensitive");
  const isLive = isStripeLiveMode();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Détail abonnement"
        description={sub.userEmail}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StripeModeBadge mode={sub.stripeMode} />
            <Button
              variant="outline"
              render={<Link href="/admin/subscriptions" />}
            >
              Retour
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="border-border flex flex-col gap-2 rounded-xl border p-4 text-sm">
          <div className="flex items-center gap-2">
            <BillingStatusBadge kind="subscription" status={sub.status} />
            {sub.cancelAtPeriodEnd ? (
              <span className="text-xs">Annulation planifiée</span>
            ) : null}
          </div>
          <p>
            <Link
              href={`/admin/users/${sub.userId}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {sub.userEmail}
            </Link>
          </p>
          <p>
            {formatMoneyCents(sub.unitAmount, sub.currency)} /{" "}
            {billingIntervalLabel(sub.billingInterval)} × {sub.quantity}
          </p>
          <p className="text-muted-foreground text-xs">
            Période :{" "}
            {sub.currentPeriodStart
              ? new Date(sub.currentPeriodStart).toLocaleDateString("fr-CA")
              : "—"}{" "}
            →{" "}
            {sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-CA")
              : "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            Sync :{" "}
            {sub.lastSyncedAt
              ? new Date(sub.lastSyncedAt).toLocaleString("fr-CA")
              : "—"}
          </p>
          {canReadSensitive ? (
            <div className="flex flex-col gap-1">
              <CopyableStripeId
                value={sub.stripeSubscriptionId}
                label="Abonnement"
              />
              <CopyableStripeId value={sub.stripeCustomerId} label="Client" />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-2">
            {sub.dashboardUrl ? (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={sub.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                Stripe Dashboard
              </Button>
            ) : null}
            {canCancel || canResume ? (
              <SubscriptionActionsDialog
                subscription={sub}
                canCancel={canCancel}
                canResume={canResume}
                isLive={isLive}
              />
            ) : null}
            {canSync ? (
              <form action={syncSubscriptionFormAction}>
                <input type="hidden" name="targetType" value="subscription" />
                <input type="hidden" name="targetId" value={sub.id} />
                <input
                  type="hidden"
                  name="idempotencyKey"
                  value={crypto.randomUUID()}
                />
                <input
                  type="hidden"
                  name="reason"
                  value="Sync manuelle détail abonnement"
                />
                <Button type="submit" size="sm" variant="secondary">
                  Resynchroniser
                </Button>
              </form>
            ) : null}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold">
          Paiements récents
        </h2>
        <PaymentsTable
          items={sub.recentPayments}
          canRefund={hasPermission(actor.role, "billing.refunds.create")}
          isLive={isLive}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold">
          Factures récentes
        </h2>
        <InvoicesTable items={sub.recentInvoices} />
      </section>
    </div>
  );
}
