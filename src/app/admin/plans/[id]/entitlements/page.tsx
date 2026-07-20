import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/features/auth";
import { isAppError } from "@/lib/errors";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { PlanEntitlementsForm } from "@/features/plans/components/plan-entitlements-form";
import { getPlan } from "@/features/plans/services/plan-queries";

type Params = Promise<{ id: string }>;

export default async function AdminPlanEntitlementsPage({
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
        title={`Fonctionnalités — ${plan.publicName}`}
        description="Entitlements regroupés par catégories."
        actions={
          <Button
            variant="outline"
            render={<Link href={`/admin/plans/${plan.id}`} />}
          >
            Retour
          </Button>
        }
      />
      <PlanEntitlementsForm
        planId={plan.id}
        initial={plan.entitlements.map((e) => ({
          key: e.key,
          enabled: e.enabled,
          limit: e.limit,
          value: e.value,
        }))}
      />
    </div>
  );
}
