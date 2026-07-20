import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { CopyableStripeId } from "@/features/billing";
import { formatMoneyCents } from "@/features/billing/lib/format";
import { PlanStatusBadge } from "@/features/plans/components/plan-status-badge";
import { PlanLifecycleActions } from "@/features/plans/components/plan-lifecycle-actions";
import {
  getPlan,
  listPlanAuditLogs,
  listPlanSubscribers,
} from "@/features/plans/services/plan-queries";
import {
  getEntitlementDefinition,
  type PlanEntitlementKey,
} from "@/features/plans/lib/entitlement-registry";

type Params = Promise<{ id: string }>;

export default async function AdminPlanDetailPage({
  params,
}: {
  params: Params;
}) {
  const actor = await requirePermission("plans.read");
  const canManage = hasPermission(actor.role, "plans.manage");
  const { id } = await params;

  let plan;
  try {
    plan = await getPlan({ planId: id });
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }

  const [subscribers, audits] = await Promise.all([
    listPlanSubscribers(plan.id),
    listPlanAuditLogs(plan.id),
  ]);

  const currentPrices = plan.prices.filter((p) => p.isCurrent);
  const formerPrices = plan.prices.filter((p) => !p.isCurrent);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={plan.publicName}
        description={plan.shortDescription ?? plan.internalName}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PlanStatusBadge status={plan.status} />
            <Button variant="outline" render={<Link href="/admin/plans" />}>
              Liste
            </Button>
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  render={<Link href={`/admin/plans/${plan.id}/edit`} />}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  render={
                    <Link href={`/admin/plans/${plan.id}/entitlements`} />
                  }
                >
                  Fonctionnalités
                </Button>
                <Button
                  variant="outline"
                  render={<Link href={`/admin/plans/${plan.id}/prices`} />}
                >
                  Tarifs
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {plan.subscribers.active > 0 ? (
        <p
          role="status"
          className="border-warning/40 bg-warning/10 text-warning-foreground rounded-lg border px-4 py-3 text-sm"
        >
          Ce forfait est utilisé par {plan.subscribers.active} abonné
          {plan.subscribers.active === 1 ? "" : "s"} actif
          {plan.subscribers.active === 1 ? "" : "s"}. Les modifications de prix
          ne modifieront pas automatiquement leurs abonnements actuels.
        </p>
      ) : null}

      {plan.reconciliationError ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          Réconciliation requise : {plan.reconciliationError}
        </p>
      ) : null}

      {canManage ? (
        <PlanLifecycleActions
          planId={plan.id}
          status={plan.status}
          publicName={plan.publicName}
        />
      ) : null}

      <section className="border-border bg-card grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Informations</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Identifiant interne</dt>
              <dd className="font-mono text-xs">{plan.internalName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Ordre</dt>
              <dd>{plan.displayOrder}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Populaire</dt>
              <dd>{plan.isFeatured ? "Oui" : "Non"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Visible inscription</dt>
              <dd>{plan.isVisibleOnSignup ? "Oui" : "Non"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Essai (jours)</dt>
              <dd>{plan.defaultTrialDays ?? "—"}</dd>
            </div>
          </dl>
          {plan.fullDescription ? (
            <p className="text-muted-foreground mt-3 text-sm whitespace-pre-wrap">
              {plan.fullDescription}
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">Abonnés</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Actifs</dt>
              <dd className="font-medium">{plan.subscribers.active}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Annulés</dt>
              <dd>{plan.subscribers.canceled}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Revenu mensuel estimé</dt>
              <dd>
                {plan.subscribers.revenueIsComplete &&
                plan.subscribers.estimatedMonthlyRevenueCents != null
                  ? formatMoneyCents(
                      plan.subscribers.estimatedMonthlyRevenueCents,
                      "cad",
                    )
                  : "Incomplet"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Prix courants</h2>
        {currentPrices.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun prix courant.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {currentPrices.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  {p.interval}/{p.intervalCount} —{" "}
                  {formatMoneyCents(p.unitAmount, p.currency)}
                </span>
                <CopyableStripeId value={p.stripePriceId} label="Price" />
              </li>
            ))}
          </ul>
        )}
        {formerPrices.length > 0 ? (
          <>
            <h3 className="mt-4 mb-2 text-sm font-semibold">Anciens prix</h3>
            <ul className="text-muted-foreground space-y-2 text-sm">
              {formerPrices.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    {p.interval}/{p.intervalCount} —{" "}
                    {formatMoneyCents(p.unitAmount, p.currency)} ({p.status})
                  </span>
                  <CopyableStripeId value={p.stripePriceId} label="Price" />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Fonctionnalités</h2>
        {plan.entitlements.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune entitlement.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {plan.entitlements.map((e) => {
              let label = e.key;
              try {
                label = getEntitlementDefinition(
                  e.key as PlanEntitlementKey,
                ).label;
              } catch {
                /* clé hors registre */
              }
              return (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>
                    {label}
                    {!e.enabled ? " (désactivé)" : ""}
                  </span>
                  <span className="text-muted-foreground">
                    {e.limit != null ? `limite ${e.limit}` : ""}
                    {e.value ? ` ${e.value}` : ""}
                    {e.limit == null && !e.value && e.enabled ? "illimité" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Abonnés (aperçu)</h2>
        {subscribers.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun abonné lié.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {subscribers.map((s) => (
              <li
                key={s.subscriptionId}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <Link
                  href={`/admin/users/${s.userId}`}
                  className="text-sebavio-navy dark:text-sebavio-gold underline-offset-2 hover:underline"
                >
                  {s.userEmail ?? s.userId}
                </Link>
                <span className="text-muted-foreground">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Technique Stripe</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs uppercase">
              Mode
            </span>
            <span>{plan.stripeMode}</span>
          </div>
          {plan.stripeProductId ? (
            <CopyableStripeId value={plan.stripeProductId} label="Produit" />
          ) : (
            <p className="text-muted-foreground text-sm">
              Pas encore de product_id Stripe.
            </p>
          )}
        </div>
      </section>

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Historique d’audit</h2>
        {audits.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun événement.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {audits.map((a) => (
              <li key={a.id} className="flex flex-col gap-0.5">
                <span className="font-medium">{a.action}</span>
                <span className="text-muted-foreground text-xs">
                  {a.actorEmail ?? "—"} ·{" "}
                  {new Intl.DateTimeFormat("fr-CA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(a.createdAt)}
                  {a.reason ? ` · ${a.reason}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
