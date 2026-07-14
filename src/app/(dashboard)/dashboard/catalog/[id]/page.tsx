import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveUser, isAdminRole } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ModelEditForm } from "@/features/vehicle-catalog/components";
import {
  getModelById,
  getModelDocuments,
  getModelKnownIssues,
  getModelSpecifications,
  listManufacturers,
} from "@/features/vehicle-catalog/services";
import { isAppError } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/features/vehicle-catalog/constants";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogModelPage({ params }: PageProps) {
  const user = await requireActiveUser();
  const isAdmin = isAdminRole(user.role);
  const { id } = await params;

  let model;
  try {
    model = await getModelById(id);
  } catch (error) {
    if (isAppError(error) && error.code === "CAT_002") notFound();
    throw error;
  }

  const [specs, documents, knownIssues, manufacturers] = await Promise.all([
    getModelSpecifications(id),
    getModelDocuments(id),
    getModelKnownIssues(id),
    listManufacturers({ pageSize: String(MAX_PAGE_SIZE), active: "true" }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/catalog"
          className="text-muted-foreground mb-3 inline-block text-sm hover:underline"
        >
          ← Catalogue
        </Link>
        <PageHeader
          title={`${model.manufacturerName ?? ""} ${model.modelName}${model.trim ? ` ${model.trim}` : ""}`.trim()}
          description={`${model.year} · ${model.category}`}
        />
        {model.source === "seed-dev" ? (
          <Badge variant="secondary" className="mt-2">
            Données fictives seed-dev
          </Badge>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spécifications</CardTitle>
          <CardDescription>
            Fiche technique du modèle catalogue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["Moteur", specs.engine],
                ["Boîte", specs.transmission],
                ["Transmission", specs.driveType],
                ["Carburant", specs.fuelType],
                ["Réservoir (L)", specs.fuelCapacityL],
                ["Conso. (L/100 km)", specs.avgConsumption],
                ["Longueur (m)", specs.lengthM],
                ["Largeur (m)", specs.widthM],
                ["Hauteur (m)", specs.heightM],
                ["PTAC (kg)", specs.gvwrKg],
                ["Couchages", specs.sleepingCapacity],
                ["Eau claire (L)", specs.freshWaterL],
                ["Eaux grises (L)", specs.greyWaterL],
                ["Eaux noires (L)", specs.blackWaterL],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">
                  {label}
                </dt>
                <dd className="text-sm font-medium">{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            URLs saisies uniquement — pas de téléversement (phase storage
            ultérieure).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun document.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {doc.title}
                  </a>{" "}
                  <span className="text-muted-foreground">
                    ({doc.documentType}, {doc.language})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problèmes connus</CardTitle>
        </CardHeader>
        <CardContent>
          {knownIssues.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun problème connu.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {knownIssues.map((issue) => (
                <li
                  key={issue.id}
                  className="border-border rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2 font-medium">
                    {issue.title}
                    <Badge variant="outline">{issue.severity}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {issue.description}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Source : {issue.source}
                    {issue.verified ? " · vérifié" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Administration — modifier</CardTitle>
            <CardDescription>
              Modification journalisée dans audit_logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModelEditForm model={model} manufacturers={manufacturers.items} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
