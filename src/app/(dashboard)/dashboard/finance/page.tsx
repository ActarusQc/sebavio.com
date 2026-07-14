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
import { FinanceDashboard } from "@/features/finance/components";
import { getFinanceDashboard } from "@/features/finance/services";
import { listVehicles } from "@/features/vehicles/services";

export default async function FinancePage() {
  const user = await requireActiveUser();
  const [dashboard, vehicles] = await Promise.all([
    getFinanceDashboard(user.id),
    listVehicles(user.id, { pageSize: "50" }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title="Finances"
        description="Budgets de voyage, dépenses et références carburant."
      />

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>
            Totaux basés uniquement sur les dépenses saisies (approche ledger).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinanceDashboard dashboard={dashboard} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carburant (véhicules)</CardTitle>
          <CardDescription>
            Suivi des pleins — à importer dans un voyage pour compter au budget.
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
                  <span>{v.displayName}</span>
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
