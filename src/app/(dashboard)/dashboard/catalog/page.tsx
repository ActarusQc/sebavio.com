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
  ManufacturerCreateForm,
  ModelCreateForm,
} from "@/features/vehicle-catalog/components";
import { listManufacturers } from "@/features/vehicle-catalog/services";
import { MAX_PAGE_SIZE } from "@/features/vehicle-catalog/constants";

export default async function CatalogPage() {
  const user = await requireActiveUser();
  const isAdmin = isAdminRole(user.role);

  const manufacturers = await listManufacturers({
    pageSize: String(MAX_PAGE_SIZE),
    active: "true",
  });

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
