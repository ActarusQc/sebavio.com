import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminPlansPage() {
  await requirePermission("plans.read");
  return (
    <AdminComingSoon
      title="Forfaits"
      phase={4}
      description="Gestion des forfaits, prix versionnés et entitlements — Phase 4."
    />
  );
}
