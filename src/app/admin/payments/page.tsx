import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminPaymentsPage() {
  await requirePermission("billing.read");
  return (
    <AdminComingSoon
      title="Paiements et factures"
      phase={3}
      description="Paiements, factures et remboursements Stripe — Phase 3."
    />
  );
}
