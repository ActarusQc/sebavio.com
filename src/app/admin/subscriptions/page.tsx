import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  SubscriptionsTable,
  subscriptionListQuerySchema,
  listSubscriptions,
  isStripeLiveMode,
  getConfiguredStripeMode,
  StripeModeBadge,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_SORT_LABELS,
  STRIPE_MODES,
  STRIPE_MODE_LABELS,
} from "@/features/billing";
import { SUBSCRIPTION_LIST_SORTS } from "@/features/billing/constants";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildQs(
  query: Record<string, unknown>,
  overrides: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (k === "page" || k === "pageSize") continue;
    if (v instanceof Date) params.set(k, v.toISOString().slice(0, 10));
    else if (typeof v === "boolean") params.set(k, v ? "true" : "false");
    else params.set(k, String(v));
  }
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  for (const [k, v] of Object.entries(overrides)) {
    if (v === "") params.delete(k);
    else params.set(k, v);
  }
  return params.toString();
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requirePermission("billing.read");
  const canExport = hasPermission(actor.role, "billing.export");
  const canCancel = hasPermission(actor.role, "billing.subscriptions.cancel");
  const canResume = hasPermission(actor.role, "billing.subscriptions.resume");
  const isLive = isStripeLiveMode();
  const stripeMode = getConfiguredStripeMode();

  const raw = await searchParams;
  const parsed = subscriptionListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    stripeMode: typeof raw.stripeMode === "string" ? raw.stripeMode : undefined,
    stripePriceId:
      typeof raw.stripePriceId === "string" ? raw.stripePriceId : undefined,
    stripeProductId:
      typeof raw.stripeProductId === "string" ? raw.stripeProductId : undefined,
    trial: typeof raw.trial === "string" ? raw.trial : undefined,
    cancelAtPeriodEnd:
      typeof raw.cancelAtPeriodEnd === "string"
        ? raw.cancelAtPeriodEnd
        : undefined,
    pastDue: typeof raw.pastDue === "string" ? raw.pastDue : undefined,
    renewFrom: typeof raw.renewFrom === "string" ? raw.renewFrom : undefined,
    renewTo: typeof raw.renewTo === "string" ? raw.renewTo : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });
  const query = parsed.success
    ? parsed.data
    : subscriptionListQuerySchema.parse({});

  const result = await listSubscriptions(query);
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
        title="Abonnements"
        description="Projection locale des abonnements Stripe."
        actions={
          <div className="flex items-center gap-2">
            <StripeModeBadge mode={stripeMode} />
            {canExport ? (
              <Button
                variant="outline"
                render={
                  <a
                    href={`/api/v1/admin/billing/subscriptions/export?${exportQs}`}
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
            placeholder="Courriel, id Stripe…"
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
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SUBSCRIPTION_STATUS_LABELS[s] ?? s}
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
          <label htmlFor="cancelAtPeriodEnd" className="text-sm font-medium">
            Annulation prévue
          </label>
          <select
            id="cancelAtPeriodEnd"
            name="cancelAtPeriodEnd"
            className={selectClassName}
            defaultValue={
              query.cancelAtPeriodEnd === undefined
                ? ""
                : query.cancelAtPeriodEnd
                  ? "true"
                  : "false"
            }
          >
            <option value="">Tous</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="pastDue" className="text-sm font-medium">
            En retard
          </label>
          <select
            id="pastDue"
            name="pastDue"
            className={selectClassName}
            defaultValue={
              query.pastDue === undefined
                ? ""
                : query.pastDue
                  ? "true"
                  : "false"
            }
          >
            <option value="">Tous</option>
            <option value="true">Oui</option>
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
            {SUBSCRIPTION_LIST_SORTS.map((s) => (
              <option key={s} value={s}>
                {SUBSCRIPTION_SORT_LABELS[s] ?? s}
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
        <Button variant="ghost" render={<Link href="/admin/subscriptions" />}>
          Réinitialiser
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} résultat{result.total === 1 ? "" : "s"}
      </p>

      <SubscriptionsTable
        items={result.items}
        canCancel={canCancel}
        canResume={canResume}
        isLive={isLive}
      />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/subscriptions?${buildQs(
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
                  href={`/admin/subscriptions?${buildQs(
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
