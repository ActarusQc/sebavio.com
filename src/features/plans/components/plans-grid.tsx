import Link from "next/link";
import { CopyableStripeId } from "@/features/billing";
import { formatMoneyCents } from "@/features/billing/lib/format";
import { PlanStatusBadge } from "@/features/plans/components/plan-status-badge";
import type { PlanListItem } from "@/features/plans/services/plan-queries";

export type PlanCardItem = Omit<PlanListItem, "lastSyncedAt"> & {
  lastSyncedAt: string | null;
};

function formatSyncedAt(iso: string | null): string {
  if (!iso) return "Jamais synchronisé";
  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function findCurrentPrice(
  prices: PlanCardItem["currentPrices"],
  interval: "month" | "year",
) {
  return prices.find((p) => p.interval === interval && p.intervalCount === 1);
}

type Props = {
  plans: PlanCardItem[];
};

export function PlansGrid({ plans }: Props) {
  if (plans.length === 0) {
    return (
      <div className="border-border bg-muted/30 rounded-lg border border-dashed px-6 py-16 text-center">
        <p className="text-foreground text-base font-medium">
          Aucun forfait dans ce mode Stripe
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Créez un forfait ou synchronisez les produits Stripe Sebavio pour
          commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan) => {
        const monthly = findCurrentPrice(plan.currentPrices, "month");
        const yearly = findCurrentPrice(plan.currentPrices, "year");

        return (
          <Link
            key={plan.id}
            href={`/admin/plans/${plan.id}`}
            className="border-border bg-card hover:border-sebavio-slate/50 flex flex-col gap-3 rounded-lg border p-4 shadow-xs transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-foreground truncate text-base font-semibold">
                  {plan.publicName}
                </h2>
                {plan.shortDescription ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {plan.shortDescription}
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1 text-sm italic">
                    Aucune description
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <PlanStatusBadge status={plan.status} />
                {plan.isFeatured ? (
                  <span className="bg-sebavio-gold/20 text-sebavio-navy dark:text-sebavio-gold rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                    Populaire
                  </span>
                ) : null}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Mensuel</dt>
                <dd className="font-medium">
                  {monthly
                    ? formatMoneyCents(monthly.unitAmount, monthly.currency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Annuel</dt>
                <dd className="font-medium">
                  {yearly
                    ? formatMoneyCents(yearly.unitAmount, yearly.currency)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Abonnés actifs
                </dt>
                <dd className="font-medium">{plan.activeSubscribers}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Dernière sync</dt>
                <dd className="text-xs font-medium">
                  {formatSyncedAt(plan.lastSyncedAt)}
                </dd>
              </div>
            </dl>

            {plan.reconciliationError ? (
              <p
                role="alert"
                className="border-warning/40 bg-warning/10 text-warning-foreground rounded-md border px-2.5 py-2 text-xs"
              >
                Réconciliation requise : {plan.reconciliationError}
              </p>
            ) : null}

            {plan.stripeProductId ? (
              <div className="border-border mt-auto border-t pt-3">
                <p className="text-muted-foreground mb-1 text-[10px] tracking-wide uppercase">
                  Technique
                </p>
                <CopyableStripeId
                  value={plan.stripeProductId}
                  label="Produit"
                />
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
