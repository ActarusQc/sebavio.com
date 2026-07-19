import { requireAdminUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { AdminCatalogPanel } from "@/features/fuel-vehicle-catalog/components/admin-catalog-panel";

export default async function AdminFuelCatalogPage() {
  await requireAdminUser();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader
        title="Catalogue carburant NRCan"
        description="Synchronisation des cotes de consommation officielles canadiennes."
      />
      <Card>
        <CardHeader>
          <CardTitle>État de la synchronisation</CardTitle>
          <CardDescription>
            Import serveur uniquement — aucune URL externe exposée au
            navigateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminCatalogPanel />
        </CardContent>
      </Card>
    </div>
  );
}
