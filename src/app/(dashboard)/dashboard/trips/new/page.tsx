import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Nouveau voyage"
        description="Le véhicule est obligatoire (Doc 4). Les lieux sont saisis en texte."
        actions={
          <Button variant="outline" render={<Link href="/dashboard/trips" />}>
            Retour
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Statut initial : planifié. Groupe de voyageurs optionnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
