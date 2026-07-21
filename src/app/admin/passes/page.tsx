import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { StripeModeBadge, getConfiguredStripeMode } from "@/features/billing";
import { PassesTable } from "@/features/subscriptions/components";
import {
  PASS_GRANT_STATUSES,
  PASS_GRANT_STATUS_LABELS,
  listPassGrants,
} from "@/features/subscriptions/services/pass-admin";
import { listPassGrantsSchema } from "@/features/subscriptions/schemas";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQs(
  query: Record<string, unknown>,
  overrides: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "page" || k === "pageSize") continue;
    params.set(k, String(v));
  }
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  for (const [k, v] of Object.entries(overrides)) {
    if (v === "") params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
}

export default async function AdminPassesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("plans.read");
  const stripeMode = getConfiguredStripeMode();
  const raw = await searchParams;

  const parsed = listPassGrantsSchema.safeParse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    status:
      typeof raw.status === "string" && raw.status.length > 0
        ? raw.status
        : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });
  const query = parsed.success ? parsed.data : listPassGrantsSchema.parse({});

  const result = await listPassGrants(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";
  const qsBase = {
    search: query.search,
    status: query.status,
    page: result.page,
    pageSize: result.pageSize,
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pass 30 jours"
        description="Droits d’accès temporaires (PlanAccessGrant)."
        actions={<StripeModeBadge mode={stripeMode} />}
      />

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <label htmlFor="search" className="text-sm font-medium">
            Recherche
          </label>
          <Input
            id="search"
            name="search"
            defaultValue={query.search ?? ""}
            placeholder="Courriel, forfait, UUID…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-sm font-medium">
            Statut
          </label>
          <select
            id="status"
            name="status"
            defaultValue={query.status ?? ""}
            className={selectClassName}
          >
            <option value="">Tous</option>
            {PASS_GRANT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PASS_GRANT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Filtrer</Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} Pass{result.total === 1 ? "" : "es"}
      </p>

      <PassesTable items={result.items} />

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          {result.page > 1 ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/admin/passes?${buildQs(qsBase, {
                    page: String(result.page - 1),
                  })}`}
                />
              }
            >
              Précédent
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm">
            Page {result.page} / {totalPages}
          </span>
          {result.page < totalPages ? (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/admin/passes?${buildQs(qsBase, {
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
