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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Mes véhicules"
        description="Gérez vos véhicules personnels, liés au catalogue ou saisis manuellement."
        actions={
          <Button render={<Link href="/dashboard/vehicles/new" />}>
            Ajouter un véhicule
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>
            Isolation stricte : seuls vos véhicules sont visibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehiclesList result={result} />
        </CardContent>
      </Card>
    </div>
  );
}
