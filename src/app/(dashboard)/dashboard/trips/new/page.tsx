import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { AppPageHero } from "@/components/common";
import { Button } from "@/components/ui";
import { TripForm } from "@/features/trips/components";
import { listVehicles } from "@/features/vehicles/services";
import { listTravelGroups } from "@/features/travel-groups/services";
import { MAX_PAGE_SIZE } from "@/features/vehicles/constants";

export default async function NewTripPage() {
  const user = await requireActiveUser();
  const [vehicles, groups] = await Promise.all([
    listVehicles(user.id, { pageSize: String(MAX_PAGE_SIZE) }),
    listTravelGroups(user.id, { pageSize: String(MAX_PAGE_SIZE) }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero
        variant="trips"
        title="Nouveau voyage"
        description="Le véhicule est obligatoire. Autocomplétion d’adresses sur départ et destination."
        breadcrumb={<span>Espace client · Voyages · Création</span>}
        actions={
          <Button variant="outline" render={<Link href="/dashboard/trips" />}>
            Retour
          </Button>
        }
      />

      <TripForm
        vehicles={vehicles.items.map((v) => ({
          id: v.id,
          displayName: v.displayName,
        }))}
        groups={groups.items.map((g) => ({
          id: g.id,
          name: g.name,
        }))}
      />
    </div>
  );
}
