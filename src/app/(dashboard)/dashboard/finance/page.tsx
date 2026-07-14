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
import { listVehicles } from "@/features/vehicles/services";

export default async function FinancePage() {
  const user = await requireActiveUser();
  const vehicles = await listVehicles(user.id, { pageSize: "50" });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Finances"
        description="Budget, dépenses et suivi carburant."
      />

      <Card>
        <CardHeader>
          <CardTitle>Carburant</CardTitle>
          <CardDescription>
            Accès au suivi des pleins par véhicule. Le module budget complet
            arrivera plus tard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun véhicule — créez-en un pour enregistrer des pleins.
            </p>
          ) : (
            <ul className="space-y-3">
              {vehicles.items.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {v.displayName}
                    {v.realAvgConsumption
                      ? ` · ${v.realAvgConsumption} L/100 km`
                      : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/dashboard/vehicles/${v.id}/fuel`} />}
                  >
                    Pleins
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
