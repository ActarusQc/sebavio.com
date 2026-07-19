import { clientIp, handleRouteError } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { exportSubscriptionsCsv } from "@/features/billing/services/export-billing";
import { subscriptionListQuerySchema } from "@/features/billing/schemas";

export async function GET(request: Request) {
  try {
    const actor = await requirePermission("billing.export");
    const url = new URL(request.url);
    const parsed = subscriptionListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      stripeMode: url.searchParams.get("stripeMode") ?? undefined,
      stripePriceId: url.searchParams.get("stripePriceId") ?? undefined,
      stripeProductId: url.searchParams.get("stripeProductId") ?? undefined,
      trial: url.searchParams.get("trial") ?? undefined,
      cancelAtPeriodEnd: url.searchParams.get("cancelAtPeriodEnd") ?? undefined,
      pastDue: url.searchParams.get("pastDue") ?? undefined,
      renewFrom: url.searchParams.get("renewFrom") ?? undefined,
      renewTo: url.searchParams.get("renewTo") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
      page: "1",
      pageSize: "20",
    });

    const { page: _page, pageSize: _pageSize, ...exportQuery } = parsed;
    void _page;
    void _pageSize;
    const result = await exportSubscriptionsCsv(exportQuery, actor, {
      ipAddress: clientIp(request),
    });

    const filename = `sebavio-subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(result.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Row-Count": String(result.rowCount),
        "X-Truncated": result.truncated ? "1" : "0",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
