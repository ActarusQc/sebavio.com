import { clientIp, handleRouteError } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { exportPaymentsCsv } from "@/features/billing/services/export-billing";
import { paymentListQuerySchema } from "@/features/billing/schemas";

export async function GET(request: Request) {
  try {
    const actor = await requirePermission("billing.export");
    const url = new URL(request.url);
    const parsed = paymentListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      stripeMode: url.searchParams.get("stripeMode") ?? undefined,
      amountMin: url.searchParams.get("amountMin") ?? undefined,
      amountMax: url.searchParams.get("amountMax") ?? undefined,
      paidFrom: url.searchParams.get("paidFrom") ?? undefined,
      paidTo: url.searchParams.get("paidTo") ?? undefined,
      createdFrom: url.searchParams.get("createdFrom") ?? undefined,
      createdTo: url.searchParams.get("createdTo") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
      page: "1",
      pageSize: "20",
    });

    const { page: _page, pageSize: _pageSize, ...exportQuery } = parsed;
    void _page;
    void _pageSize;
    const result = await exportPaymentsCsv(exportQuery, actor, {
      ipAddress: clientIp(request),
    });

    const filename = `sebavio-payments-${new Date().toISOString().slice(0, 10)}.csv`;
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
