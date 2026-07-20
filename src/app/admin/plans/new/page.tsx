import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { CreatePlanForm } from "@/features/plans/components/create-plan-form";

export default async function AdminPlansNewPage() {
  const actor = await requirePermission("plans.manage");
  void actor;
  const canManage = hasPermission(actor.role, "plans.manage");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Créer un forfait"
        description="Produit et prix Stripe + métadonnées Sebavio (mode courant)."
        actions={
          <Button variant="outline" render={<Link href="/admin/plans" />}>
            Retour à la liste
          </Button>
        }
      />
      {canManage ? <CreatePlanForm /> : null}
    </div>
  );
}
