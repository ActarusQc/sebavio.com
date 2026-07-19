import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminAnalyticsPage() {
  await requirePermission("analytics.read");
  return (
    <AdminComingSoon
      title="Statistiques"
      phase={6}
      description="Métriques commerciales et produit enrichies — Phase 6."
    />
  );
}
