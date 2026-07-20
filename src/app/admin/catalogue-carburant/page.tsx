import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminFuelCatalogPage() {
  await requirePermission("content.manage");
  return (
    <AdminComingSoon
      title="Catalogue carburant NRCan"
      phase={1}
      description="Le catalogue carburant NRCan sera disponible prochainement. Synchronisation des cotes de consommation officielles canadiennes."
    />
  );
}
