import { clientIp, handleRouteError } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { exportAdminUsersCsv } from "@/features/admin/services";
import { adminUserListQuerySchema } from "@/features/admin/schemas";

export async function GET(request: Request) {
  try {
    const actor = await requirePermission("users.export");
    const url = new URL(request.url);
    const parsed = adminUserListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      emailVerified: url.searchParams.get("emailVerified") ?? undefined,
      createdFrom: url.searchParams.get("createdFrom") ?? undefined,
      createdTo: url.searchParams.get("createdTo") ?? undefined,
      hasTrips: url.searchParams.get("hasTrips") ?? undefined,
      hasVehicles: url.searchParams.get("hasVehicles") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
      page: "1",
      pageSize: "20",
    });

    const { page: _page, pageSize: _pageSize, ...exportQuery } = parsed;
    void _page;
    void _pageSize;
    const result = await exportAdminUsersCsv(exportQuery, actor, {
      ipAddress: clientIp(request),
    });

    const filename = `sebavio-users-${new Date().toISOString().slice(0, 10)}.csv`;
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
