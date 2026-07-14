import Link from "next/link";
import { requireActiveUser } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { MaintenanceForm } from "@/features/maintenance/components";
import { listTemplatesForModel } from "@/features/maintenance/services";
import { listVehicles } from "@/features/vehicles/services";
import { MAX_PAGE_SIZE } from "@/features/vehicles/constants";
import type { MaintenanceTemplateDto } from "@/features/maintenance/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MaintenanceNewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireActiveUser();
  const params = await searchParams;
  const defaultVehicleId = Array.isArray(params.vehicleId)
    ? params.vehicleId[0]
    : params.vehicleId;

  const vehicles = await listVehicles(user.id, {
    pageSize: String(MAX_PAGE_SIZE),
  });

  const modelIds = [
    ...new Set(
      vehicles.items
        .map((v) => v.modelId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const templatesNested = await Promise.all(
    modelIds.map((id) => listTemplatesForModel(id)),
  );
  const templates: MaintenanceTemplateDto[] = templatesNested.flat();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/maintenance"
          className="text-muted-foreground mb-3 inline-block text-sm hover:underline"
        >
          ← Entretien
        </Link>
        <PageHeader
          title="Nouvel entretien"
          description="Enregistrement d’une intervention — recalcule automatiquement les échéances."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulaire</CardTitle>
          <CardDescription>
            Le kilométrage doit être ≥ odomètre courant du véhicule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceForm
            vehicles={vehicles.items}
            templates={templates}
            defaultVehicleId={defaultVehicleId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
