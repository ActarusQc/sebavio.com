import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { EditPlanForm } from "@/features/plans/components/edit-plan-form";
import { getPlan } from "@/features/plans/services/plan-queries";

type Params = Promise<{ id: string }>;

export default async function AdminPlanEditPage({
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

  if (plan.status === "archived") {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Modification impossible" />
        <p className="text-sm">Ce forfait est archivé.</p>
        <Button render={<Link href={`/admin/plans/${plan.id}`} />}>
          Retour au détail
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Modifier — ${plan.publicName}`}
        description="Métadonnées commerciales uniquement (pas les montants Stripe)."
        actions={
          <Button
            variant="outline"
            render={<Link href={`/admin/plans/${plan.id}`} />}
          >
            Retour
          </Button>
        }
      />
      <EditPlanForm
        planId={plan.id}
        initial={{
          publicName: plan.publicName,
          shortDescription: plan.shortDescription,
          fullDescription: plan.fullDescription,
          displayOrder: plan.displayOrder,
          isFeatured: plan.isFeatured,
          isVisibleOnSignup: plan.isVisibleOnSignup,
          defaultTrialDays: plan.defaultTrialDays,
        }}
      />
    </div>
  );
}
