import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { UsersTable } from "@/features/admin/components";
import { listAdminUsers } from "@/features/admin/services";
import { adminUserListQuerySchema } from "@/features/admin/schemas";
import { ROLE_LABELS } from "@/features/admin/constants";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("users.read");

  const raw = await searchParams;
  const parsed = adminUserListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    role: typeof raw.role === "string" ? raw.role : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const query = parsed.success
    ? parsed.data
    : { page: 1, pageSize: 20 as const };

  const result = await listAdminUsers(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Utilisateurs"
        description="Recherche, consultation et gestion des comptes."
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
        <Button type="submit">Filtrer</Button>
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
                  href={`/admin/users?${new URLSearchParams({
                    ...(query.q ? { q: query.q } : {}),
                    ...(query.status ? { status: query.status } : {}),
                    ...(query.role ? { role: query.role } : {}),
                    page: String(result.page - 1),
                  }).toString()}`}
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
                  href={`/admin/users?${new URLSearchParams({
                    ...(query.q ? { q: query.q } : {}),
                    ...(query.status ? { status: query.status } : {}),
                    ...(query.role ? { role: query.role } : {}),
                    page: String(result.page + 1),
                  }).toString()}`}
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
