import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminSettingsPage() {
  await requirePermission("settings.read");
  return (
    <AdminComingSoon
      title="Paramètres"
      phase={7}
      description="Paramètres sensibles et durcissement production — Phase 7."
    />
  );
}
