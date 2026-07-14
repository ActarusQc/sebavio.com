import { Suspense } from "react";
import { requireActiveUser, isAdminRole } from "@/features/auth";
import { PageHeader } from "@/components/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  CatalogFilters,
  CatalogImportForm,
  CatalogList,
  ManufacturerCreateForm,
  ModelCreateForm,
} from "@/features/vehicle-catalog/components";
import {
  listManufacturers,
  listModels,
} from "@/features/vehicle-catalog/services";
import { MAX_PAGE_SIZE } from "@/features/vehicle-catalog/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireActiveUser();
  const isAdmin = isAdminRole(user.role);
  const params = await searchParams;

  const query: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    query[key] = Array.isArray(value) ? value[0] : value;
  }

  // Cap serveur pageSize (jamais de dump).
  if (query.pageSize) {
    const n = Number(query.pageSize);
    if (Number.isFinite(n) && n > MAX_PAGE_SIZE) {
      query.pageSize = String(MAX_PAGE_SIZE);
    }
  }

  const [manufacturers, models] = await Promise.all([
    listManufacturers({ pageSize: String(MAX_PAGE_SIZE), active: "true" }),
    listModels(query),
  ]);

  const baseQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== "page") baseQuery.set(key, value);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <PageHeader
        title="Catalogue véhicules"
        description="Constructeurs et modèles de référence (lecture pour tous les comptes connectés)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recherche et filtres</CardTitle>
          <CardDescription>
            Filtrer par constructeur, catégorie, année, carburant ou mot-clé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <CatalogFilters manufacturers={manufacturers.items} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modèles</CardTitle>
          <CardDescription>
            Résultats paginés (max {MAX_PAGE_SIZE} par page).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CatalogList result={models} baseQuery={baseQuery.toString()} />
        </CardContent>
      </Card>

      {isAdmin ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Administration — constructeur</CardTitle>
              <CardDescription>
                Création réservée aux rôles admin / super_admin (audit_logs).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManufacturerCreateForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administration — modèle</CardTitle>
              <CardDescription>
                Ajouter un modèle / version au catalogue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelCreateForm manufacturers={manufacturers.items} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administration — import JSON</CardTitle>
              <CardDescription>
                Validation ligne par ligne avec rapport détaillé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CatalogImportForm />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
