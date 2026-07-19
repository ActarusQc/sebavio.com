import { requirePermission } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { DashboardStats } from "@/features/admin/components";
import { getAdminDashboardStats } from "@/features/admin/services";

export default async function AdminPage() {
  await requirePermission("admin.dashboard");
  const stats = await getAdminDashboardStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Administration"
        description="Vue d'ensemble du système — indicateurs agrégés (cache Redis court)."
      />
      <DashboardStats stats={stats} />
    </div>
  );
}
