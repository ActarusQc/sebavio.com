import Link from "next/link";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { AuditTable } from "@/features/admin/components";
import { listAdminAuditLogs } from "@/features/admin/services";
import { adminAuditQuerySchema } from "@/features/admin/schemas";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const parsed = adminAuditQuerySchema.safeParse({
    userId: typeof raw.userId === "string" ? raw.userId : undefined,
    entity: typeof raw.entity === "string" ? raw.entity : undefined,
    action: typeof raw.action === "string" ? raw.action : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });

  const query = parsed.success
    ? parsed.data
    : { page: 1, pageSize: 30 as const };

  const result = await listAdminAuditLogs(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal d'audit"
        description="Lecture seule — journal immuable (aucune modification ni suppression)."
      />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex min-w-[10rem] flex-col gap-1">
          <label htmlFor="userId" className="text-sm font-medium">
            Utilisateur (UUID)
          </label>
          <Input
            id="userId"
            name="userId"
            defaultValue={query.userId ?? ""}
            placeholder="uuid"
          />
        </div>
        <div className="flex min-w-[8rem] flex-col gap-1">
          <label htmlFor="entity" className="text-sm font-medium">
            Entité
          </label>
          <Input
            id="entity"
            name="entity"
            defaultValue={query.entity ?? ""}
            placeholder="users"
          />
        </div>
        <div className="flex min-w-[8rem] flex-col gap-1">
          <label htmlFor="action" className="text-sm font-medium">
            Action
          </label>
          <Input
            id="action"
            name="action"
            defaultValue={query.action ?? ""}
            placeholder="ADMIN_SUSPEND"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-sm font-medium">
            Du
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={
              query.from ? query.from.toISOString().slice(0, 10) : ""
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-sm font-medium">
            Au
          </label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={query.to ? query.to.toISOString().slice(0, 10) : ""}
          />
        </div>
        <Button type="submit">Filtrer</Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} entrée{result.total === 1 ? "" : "s"}
      </p>

      <AuditTable items={result.items} />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/audit?${new URLSearchParams({
                    ...(query.userId ? { userId: query.userId } : {}),
                    ...(query.entity ? { entity: query.entity } : {}),
                    ...(query.action ? { action: query.action } : {}),
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
                  href={`/admin/audit?${new URLSearchParams({
                    ...(query.userId ? { userId: query.userId } : {}),
                    ...(query.entity ? { entity: query.entity } : {}),
                    ...(query.action ? { action: query.action } : {}),
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
