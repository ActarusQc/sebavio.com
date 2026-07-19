import Link from "next/link";
import { requirePermission } from "@/features/auth";
import { hasPermission } from "@/lib/rbac";
import { PageHeader } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  WebhooksTable,
  webhookListQuerySchema,
  listWebhooks,
  getConfiguredStripeMode,
  StripeModeBadge,
  WEBHOOK_STATUSES,
  WEBHOOK_STATUS_LABELS,
  WEBHOOK_SORT_LABELS,
  WEBHOOK_LIST_SORTS,
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

export default async function AdminStripeWebhooksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const actor = await requirePermission("billing.webhooks.read");
  const canRetry = hasPermission(actor.role, "billing.webhooks.retry");
  const stripeMode = getConfiguredStripeMode();
  const raw = await searchParams;
  const parsed = webhookListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    stripeMode: typeof raw.stripeMode === "string" ? raw.stripeMode : undefined,
    objectId: typeof raw.objectId === "string" ? raw.objectId : undefined,
    receivedFrom:
      typeof raw.receivedFrom === "string" ? raw.receivedFrom : undefined,
    receivedTo: typeof raw.receivedTo === "string" ? raw.receivedTo : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
  });
  const query = parsed.success ? parsed.data : webhookListQuerySchema.parse({});
  const result = await listWebhooks(query);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const selectClassName =
    "border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks Stripe"
        description="Diagnostic des événements webhook (sans payload sensible)."
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
            placeholder="evt_, type, objet…"
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
            {WEBHOOK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {WEBHOOK_STATUS_LABELS[s] ?? s}
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
            {WEBHOOK_LIST_SORTS.map((s) => (
              <option key={s} value={s}>
                {WEBHOOK_SORT_LABELS[s] ?? s}
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
        <Button variant="ghost" render={<Link href="/admin/webhooks/stripe" />}>
          Réinitialiser
        </Button>
      </form>

      <p className="text-muted-foreground text-sm">
        {result.total} résultat{result.total === 1 ? "" : "s"}
      </p>

      <WebhooksTable items={result.items} canRetry={canRetry} />

      {totalPages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {result.page > 1 ? (
            <Button
              variant="outline"
              render={
                <Link
                  href={`/admin/webhooks/stripe?${buildQs(
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
                  href={`/admin/webhooks/stripe?${buildQs(
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
