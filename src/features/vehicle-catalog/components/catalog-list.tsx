import Link from "next/link";
import { EmptyState } from "@/components/common";
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type {
  PaginatedResult,
  VehicleModelDto,
} from "@/features/vehicle-catalog/types";

type CatalogListProps = {
  result: PaginatedResult<VehicleModelDto>;
  baseQuery: string;
};

export function CatalogList({ result, baseQuery }: CatalogListProps) {
  if (result.items.length === 0) {
    return (
      <EmptyState
        title="Aucun modèle"
        description="Aucun véhicule ne correspond aux filtres."
      />
    );
  }

  const prevPage = result.page > 1 ? result.page - 1 : null;
  const nextPage = result.page < result.totalPages ? result.page + 1 : null;

  function pageHref(page: number) {
    const params = new URLSearchParams(baseQuery);
    params.set("page", String(page));
    return `/dashboard/catalog?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Constructeur</TableHead>
            <TableHead>Modèle</TableHead>
            <TableHead>Année</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Carburant</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.items.map((model) => (
            <TableRow key={model.id}>
              <TableCell>{model.manufacturerName ?? "—"}</TableCell>
              <TableCell>
                <Link
                  href={`/dashboard/catalog/${model.id}`}
                  className="text-primary font-medium underline-offset-4 hover:underline"
                >
                  {model.modelName}
                  {model.trim ? ` ${model.trim}` : ""}
                </Link>
              </TableCell>
              <TableCell>{model.year}</TableCell>
              <TableCell>{model.category}</TableCell>
              <TableCell>{model.fuelType ?? "—"}</TableCell>
              <TableCell>
                {model.source === "seed-dev" ? (
                  <Badge variant="secondary">seed-dev</Badge>
                ) : (
                  model.source
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          Page {result.page} / {result.totalPages} · {result.total} modèle(s)
        </span>
        <div className="flex gap-3">
          {prevPage ? (
            <Link href={pageHref(prevPage)} className="hover:underline">
              ← Précédent
            </Link>
          ) : (
            <span className="opacity-40">← Précédent</span>
          )}
          {nextPage ? (
            <Link href={pageHref(nextPage)} className="hover:underline">
              Suivant →
            </Link>
          ) : (
            <span className="opacity-40">Suivant →</span>
          )}
        </div>
      </div>
    </div>
  );
}
