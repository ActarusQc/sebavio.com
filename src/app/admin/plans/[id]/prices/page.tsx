import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { CopyableStripeId } from "@/features/billing";
import { formatMoneyCents } from "@/features/billing/lib/format";
import { CreatePlanPriceForm } from "@/features/plans/components/create-plan-price-form";
import { getPlan } from "@/features/plans/services/plan-queries";

type Params = Promise<{ id: string }>;

export default async function AdminPlanPricesPage({
  params,
}: {
  params: Params;
}) {
  await requirePermission("plans.manage");
  const { id } = await params;

  let plan;
  try {
    plan = await getPlan({ planId: id });
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Tarifs — ${plan.publicName}`}
        description="Création d’un nouveau Price Stripe. Les abonnements existants gardent leur ancien prix."
        actions={
          <Button
            variant="outline"
            render={<Link href={`/admin/plans/${plan.id}`} />}
          >
            Retour
          </Button>
        }
      />

      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-semibold">Prix existants</h2>
        <ul className="space-y-2 text-sm">
          {plan.prices.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                {p.isCurrent ? "●" : "○"} {p.interval}/{p.intervalCount} —{" "}
                {formatMoneyCents(p.unitAmount, p.currency)} ({p.status})
              </span>
              <CopyableStripeId value={p.stripePriceId} label="Price" />
            </li>
          ))}
        </ul>
      </section>

      {plan.status !== "archived" ? (
        <CreatePlanPriceForm
          planId={plan.id}
          activeSubscribers={plan.subscribers.active}
        />
      ) : (
        <p className="text-sm">Forfait archivé — aucun nouveau tarif.</p>
      )}
    </div>
  );
}
