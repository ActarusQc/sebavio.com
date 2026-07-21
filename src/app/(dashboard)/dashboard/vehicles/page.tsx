import Link from "next/link";
import { Plus } from "lucide-react";
import { requireActiveUser } from "@/features/auth";
import { AppPageHero } from "@/components/common";
import { Button } from "@/components/ui";
import { VehiclesList } from "@/features/vehicles/components";
import { listVehicles } from "@/features/vehicles/services";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireActiveUser();
  const params = await searchParams;

  const query: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    query[key] = Array.isArray(value) ? value[0] : value;
  }

  const result = await listVehicles(user.id, query);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="vehicles"
        title="Mes véhicules"
        description="Gérez vos véhicules personnels, liés au catalogue ou saisis manuellement."
        breadcrumb={<span>Espace client · Véhicules</span>}
        actions={
          <Button size="lg" render={<Link href="/dashboard/vehicles/new" />}>
            <Plus data-icon="inline-start" />
            Ajouter un véhicule
          </Button>
        }
      />

      <VehiclesList result={result} />
    </div>
  );
}
