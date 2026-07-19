import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { UsersTable } from "@/features/admin/components";
import { listAdminUsers } from "@/features/admin/services";
import {
  adminUserListQuerySchema,
  ADMIN_USER_LIST_SORTS,
} from "@/features/admin/schemas";
import { ROLE_LABELS, USER_LIST_SORT_LABELS } from "@/features/admin/constants";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildUsersQueryString(
  query: {
    q?: string;
    status?: string;
    role?: string;
    emailVerified?: boolean;
    createdFrom?: Date;
    createdTo?: Date;
    hasTrips?: boolean;
    hasVehicles?: boolean;
    sort?: string;
    order?: string;
    page?: number;
    pageSize?: number;
  },
  overrides: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.role) params.set("role", query.role);
  if (query.emailVerified !== undefined) {
    params.set("emailVerified", query.emailVerified ? "true" : "false");
  }
  if (query.createdFrom) {
    params.set("createdFrom", query.createdFrom.toISOString().slice(0, 10));
  }
  if (query.createdTo) {
    params.set("createdTo", query.createdTo.toISOString().slice(0, 10));
  }
  if (query.hasTrips !== undefined) {
    params.set("hasTrips", query.hasTrips ? "true" : "false");
  }
  if (query.hasVehicles !== undefined) {
    params.set("hasVehicles", query.hasVehicles ? "true" : "false");
  }
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.page) params.set("page", String(query.page));
  for (const [k, v] of Object.entries(overrides)) {
    if (v === "") params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
}

function toDateInputValue(d: Date | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requirePermission("users.read");
  const canExport = hasPermission(actor.role, "users.export");

  const raw = await searchParams;
  const parsed = adminUserListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    emailVerified:
      typeof raw.emailVerified === "string" ? raw.emailVerified : undefined,
    createdFrom:
      typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    hasTrips: typeof raw.hasTrips === "string" ? raw.hasTrips : undefined,
    hasVehicles:
      typeof raw.hasVehicles === "string" ? raw.hasVehicles : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const query = parsed.success
    ? parsed.data
    : adminUserListQuerySchema.parse({});

  const result = await listAdminUsers(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";

  const exportQs = buildUsersQueryString(query, { page: "", pageSize: "" });
  const boolSelectValue = (v: boolean | undefined) =>
    v === undefined ? "" : v ? "true" : "false";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilisateurs"
        description="Recherche, consultation et gestion des comptes."
        actions={
          canExport ? (
            <Button
              variant="outline"
              render={
                <a href={`/api/v1/admin/users/export?${exportQs}`} download />
              }
            >
              Exporter CSV
            </Button>
          ) : undefined
        }
      />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-sm font-medium">
            Recherche
          </label>
          <Input
            id="q"
            name="q"
            defaultValue={query.q ?? ""}
            placeholder="Courriel, prénom, nom…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium">
            Statut
          </label>
          <select
            id="status"
            name="status"
            className={selectClassName}
            defaultValue={query.status ?? ""}
          >
            <option value="">Tous</option>
            {USER_STATUSES.filter((s) => s !== "deleted").map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium">
            Rôle
          </label>
          <select
            id="role"
            name="role"
            className={selectClassName}
            defaultValue={query.role ?? ""}
          >
            <option value="">Tous</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r] ?? r}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="emailVerified" className="text-sm font-medium">
            Courriel vérifié
          </label>
          <select
            id="emailVerified"
            name="emailVerified"
            className={selectClassName}
            defaultValue={boolSelectValue(query.emailVerified)}
          >
            <option value="">Tous</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasTrips" className="text-sm font-medium">
            Voyages
          </label>
          <select
            id="hasTrips"
            name="hasTrips"
            className={selectClassName}
            defaultValue={boolSelectValue(query.hasTrips)}
          >
            <option value="">Tous</option>
            <option value="true">Avec</option>
            <option value="false">Sans</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="hasVehicles" className="text-sm font-medium">
            Véhicules
          </label>
          <select
            id="hasVehicles"
            name="hasVehicles"
            className={selectClassName}
            defaultValue={boolSelectValue(query.hasVehicles)}
          >
            <option value="">Tous</option>
            <option value="true">Avec</option>
            <option value="false">Sans</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="createdFrom" className="text-sm font-medium">
            Inscrit du
          </label>
          <Input
            id="createdFrom"
            name="createdFrom"
            type="date"
            defaultValue={toDateInputValue(query.createdFrom)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="createdTo" className="text-sm font-medium">
            au
          </label>
          <Input
            id="createdTo"
            name="createdTo"
            type="date"
            defaultValue={toDateInputValue(query.createdTo)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-sm font-medium">
            Tri
          </label>
          <select
            id="sort"
            name="sort"
            className={selectClassName}
            defaultValue={query.sort}
          >
            {ADMIN_USER_LIST_SORTS.map((s) => (
              <option key={s} value={s}>
                {USER_LIST_SORT_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="order" className="text-sm font-medium">
            Ordre
          </label>
          <select
            id="order"
            name="order"
            className={selectClassName}
            defaultValue={query.order}
          >
            <option value="desc">Descendant</option>
            <option value="asc">Ascendant</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pageSize" className="text-sm font-medium">
            Par page
          </label>
          <select
            id="pageSize"
            name="pageSize"
            className={selectClassName}
            defaultValue={String(query.pageSize)}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <Button type="submit">Filtrer</Button>
        <Button variant="ghost" render={<Link href="/admin/users" />}>
          Réinitialiser
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} résultat{result.total === 1 ? "" : "s"}
      </p>

      <UsersTable items={result.items} />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/users?${buildUsersQueryString(query, {
                    page: String(result.page - 1),
                  })}`}
                />
              }
            >
              Précédent
            </Button>
          ) : null}
          <span>
            Page {result.page} / {totalPages}
          </span>
          {result.page < totalPages ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/users?${buildUsersQueryString(query, {
                    page: String(result.page + 1),
                  })}`}
                />
              }
            >
              Suivant
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
