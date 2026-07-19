import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminSubscriptionsPage() {
  await requirePermission("billing.read");
  return (
    <AdminComingSoon
      title="Abonnements"
      phase={3}
      description="Gestion Stripe des abonnements — Phase 3."
    />
  );
}
