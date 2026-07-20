import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { isAppError } from "@/lib/errors";
import { getConfiguredStripeMode } from "@/features/billing";
import { listPlans } from "@/features/plans/services/plan-queries";
import { PlansPageHeader } from "@/features/plans/components/plans-page-header";
import {
  PlansGrid,
  type PlanCardItem,
} from "@/features/plans/components/plans-grid";

export default async function AdminPlansPage() {
  const actor = await requirePermission("plans.read");
  const canManage = hasPermission(actor.role, "plans.manage");
  const stripeMode = getConfiguredStripeMode();

  let plans: PlanCardItem[] = [];
  let loadError: string | null = null;

  try {
    const rows = await listPlans({});
    plans = rows.map((p) => ({
      ...p,
      lastSyncedAt: p.lastSyncedAt ? p.lastSyncedAt.toISOString() : null,
    }));
  } catch (error) {
    loadError = isAppError(error)
      ? error.message
      : "Impossible de charger les forfaits.";
  }

  return (
    <div className="flex flex-col gap-6">
      <PlansPageHeader stripeMode={stripeMode} canManage={canManage} />

      {loadError ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm"
        >
          {loadError}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {plans.length} forfait{plans.length === 1 ? "" : "s"} (mode{" "}
            {stripeMode})
          </p>
          <PlansGrid plans={plans} />
        </>
      )}
    </div>
  );
}
