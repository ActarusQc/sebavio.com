import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { isAppError } from "@/lib/errors";
import { PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui";
import {
  CopyableStripeId,
  StripeModeBadge,
  getConfiguredStripeMode,
} from "@/features/billing";
import { formatMoneyCents } from "@/features/billing/lib/format";
import { PassGrantActions } from "@/features/subscriptions/components";
import {
  PASS_GRANT_STATUS_LABELS,
  getPassGrantDetail,
  type PassGrantStatus,
} from "@/features/subscriptions/services/pass-admin";

type Params = Promise<{ id: string }>;

function statusVariant(
  status: string,
): "success" | "warning" | "error" | "neutral" | "info" {
  if (status === "active") return "success";
  if (status === "pending_payment") return "info";
  if (status === "expired") return "warning";
  if (
    status === "revoked" ||
    status === "refunded" ||
    status === "payment_failed"
  )
    return "error";
  return "neutral";
}

export default async function AdminPassDetailPage({
  params,
}: {
  params: Params;
}) {
  const actor = await requirePermission("plans.read");
  const canManage = hasPermission(actor.role, "plans.manage");
  const stripeMode = getConfiguredStripeMode();
  const { id } = await params;

  let grant;
  try {
    grant = await getPassGrantDetail(id);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }

  const statusLabel =
    PASS_GRANT_STATUS_LABELS[grant.status as PassGrantStatus] ?? grant.status;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Détail Pass"
        description={grant.userEmail}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StripeModeBadge mode={stripeMode} />
            <Button variant="outline" render={<Link href="/admin/passes" />}>
              Retour
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="border-border flex flex-col gap-2 rounded-xl border p-4 text-sm">
          <div className="flex items-center gap-2">
            <StatusBadge status={statusVariant(grant.status)}>
              {statusLabel}
            </StatusBadge>
            <StripeModeBadge
              mode={grant.stripeMode === "live" ? "live" : "test"}
            />
          </div>
          <p>
            <Link
              href={`/admin/users/${grant.userId}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {grant.userEmail}
            </Link>
            {grant.userName ? (
              <span className="text-muted-foreground"> — {grant.userName}</span>
            ) : null}
          </p>
          <p>
            Forfait :{" "}
            <Link
              href={`/admin/plans/${grant.planId}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {grant.planPublicName}
            </Link>
            <span className="text-muted-foreground font-mono text-xs">
              {" "}
              ({grant.planInternalName})
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            Début : {new Date(grant.startsAt).toLocaleString("fr-CA")}
          </p>
          <p className="text-muted-foreground text-xs">
            Fin : {new Date(grant.endsAt).toLocaleString("fr-CA")}
          </p>
          <p className="text-sm">
            Jours restants :{" "}
            {grant.status === "active" ? grant.remainingDays : "—"}
          </p>
          {grant.revokedAt ? (
            <p className="text-destructive text-xs">
              Révoqué le {new Date(grant.revokedAt).toLocaleString("fr-CA")}
              {grant.revokedByAdminEmail
                ? ` par ${grant.revokedByAdminEmail}`
                : ""}
              {grant.revokedReason ? ` — ${grant.revokedReason}` : ""}
            </p>
          ) : null}
          {grant.lastAdminExtendAt ? (
            <p className="text-muted-foreground text-xs">
              Dernière prolongation admin : +{grant.lastAdminExtendDays} j le{" "}
              {new Date(grant.lastAdminExtendAt).toLocaleString("fr-CA")}
              {grant.lastAdminExtendByEmail
                ? ` par ${grant.lastAdminExtendByEmail}`
                : ""}
              {grant.lastAdminExtendReason
                ? ` — ${grant.lastAdminExtendReason}`
                : ""}
            </p>
          ) : null}
          <div className="pt-2">
            <PassGrantActions
              grantId={grant.id}
              status={grant.status}
              canManage={canManage}
            />
          </div>
        </section>

        <section className="border-border flex flex-col gap-2 rounded-xl border p-4 text-sm">
          <h2 className="font-heading text-base font-semibold">Achat source</h2>
          {grant.sourcePurchase ? (
            <>
              <p>Statut : {grant.sourcePurchase.status}</p>
              <p>
                Montant :{" "}
                {formatMoneyCents(
                  grant.sourcePurchase.amountCents,
                  grant.sourcePurchase.currency,
                )}
              </p>
              <p className="text-muted-foreground text-xs">
                Payé :{" "}
                {grant.sourcePurchase.paidAt
                  ? new Date(grant.sourcePurchase.paidAt).toLocaleString(
                      "fr-CA",
                    )
                  : "—"}
              </p>
              {grant.sourcePurchase.stripeCheckoutSessionId ? (
                <CopyableStripeId
                  value={grant.sourcePurchase.stripeCheckoutSessionId}
                  label="Checkout"
                />
              ) : null}
              {grant.sourcePurchase.stripePaymentIntentId ? (
                <CopyableStripeId
                  value={grant.sourcePurchase.stripePaymentIntentId}
                  label="PaymentIntent"
                />
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Aucun achat lié.</p>
          )}
        </section>
      </div>
    </div>
  );
}
