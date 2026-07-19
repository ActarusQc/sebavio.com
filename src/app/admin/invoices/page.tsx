import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  InvoicesTable,
  invoiceListQuerySchema,
  listInvoices,
  getConfiguredStripeMode,
  StripeModeBadge,
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_SORT_LABELS,
  INVOICE_LIST_SORTS,
  STRIPE_MODES,
  STRIPE_MODE_LABELS,
} from "@/features/billing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQs(
  query: Record<string, unknown>,
  overrides: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (v instanceof Date) params.set(k, v.toISOString().slice(0, 10));
    else if (typeof v === "boolean") params.set(k, v ? "true" : "false");
    else params.set(k, String(v));
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === "") params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
}

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission("billing.invoices.read");
  const stripeMode = getConfiguredStripeMode();
  const raw = await searchParams;
  const parsed = invoiceListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    stripeMode: typeof raw.stripeMode === "string" ? raw.stripeMode : undefined,
    createdFrom:
      typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });
  const query = parsed.success ? parsed.data : invoiceListQuerySchema.parse({});
  const result = await listInvoices(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factures"
        description="Factures Stripe synchronisées."
        actions={<StripeModeBadge mode={stripeMode} />}
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
            placeholder="Numéro, courriel…"
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
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INVOICE_STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="stripeMode" className="text-sm font-medium">
            Mode
          </label>
          <select
            id="stripeMode"
            name="stripeMode"
            className={selectClassName}
            defaultValue={query.stripeMode ?? ""}
          >
            <option value="">Tous</option>
            {STRIPE_MODES.map((m) => (
              <option key={m} value={m}>
                {STRIPE_MODE_LABELS[m]}
              </option>
            ))}
          </select>
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
            {INVOICE_LIST_SORTS.map((s) => (
              <option key={s} value={s}>
                {INVOICE_SORT_LABELS[s] ?? s}
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
        <Button variant="ghost" render={<Link href="/admin/invoices" />}>
          Réinitialiser
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} résultat{result.total === 1 ? "" : "s"}
      </p>

      <InvoicesTable items={result.items} />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/invoices?${buildQs(
                    query as unknown as Record<string, unknown>,
                    { page: String(result.page - 1) },
                  )}`}
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
                  href={`/admin/invoices?${buildQs(
                    query as unknown as Record<string, unknown>,
                    { page: String(result.page + 1) },
                  )}`}
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
