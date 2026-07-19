import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  PaymentsTable,
  paymentListQuerySchema,
  listPayments,
  isStripeLiveMode,
  getConfiguredStripeMode,
  StripeModeBadge,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_SORT_LABELS,
  PAYMENT_LIST_SORTS,
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

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requirePermission("billing.payments.read");
  const canExport = hasPermission(actor.role, "billing.export");
  const canRefund = hasPermission(actor.role, "billing.refunds.create");
  const isLive = isStripeLiveMode();
  const stripeMode = getConfiguredStripeMode();

  const raw = await searchParams;
  const parsed = paymentListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    stripeMode: typeof raw.stripeMode === "string" ? raw.stripeMode : undefined,
    amountMin: typeof raw.amountMin === "string" ? raw.amountMin : undefined,
    amountMax: typeof raw.amountMax === "string" ? raw.amountMax : undefined,
    createdFrom:
      typeof raw.createdFrom === "string" ? raw.createdFrom : undefined,
    createdTo: typeof raw.createdTo === "string" ? raw.createdTo : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });
  const query = parsed.success ? parsed.data : paymentListQuerySchema.parse({});
  const result = await listPayments(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";
  const exportQs = buildQs(query as unknown as Record<string, unknown>, {
    page: "",
    pageSize: "",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paiements"
        description="PaymentIntents Stripe synchronisés."
        actions={
          <div className="flex items-center gap-2">
            <StripeModeBadge mode={stripeMode} />
            {canExport ? (
              <Button
                variant="outline"
                render={
                  <a
                    href={`/api/v1/admin/billing/payments/export?${exportQs}`}
                    download
                  />
                }
              >
                Exporter CSV
              </Button>
            ) : null}
          </div>
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
            placeholder="Courriel, PaymentIntent…"
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
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s] ?? s}
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
            {PAYMENT_LIST_SORTS.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_SORT_LABELS[s] ?? s}
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
        <Button variant="ghost" render={<Link href="/admin/payments" />}>
          Réinitialiser
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} résultat{result.total === 1 ? "" : "s"}
      </p>

      <PaymentsTable
        items={result.items}
        canRefund={canRefund}
        isLive={isLive}
      />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/payments?${buildQs(
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
                  href={`/admin/payments?${buildQs(
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
