import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { listAdminAuditLogs } from "@/features/admin/services";
import { adminAuditQuerySchema } from "@/features/admin/schemas";

export async function GET(request: Request) {
  try {
    await requirePermission("audit.read");
    const url = new URL(request.url);
    const query = adminAuditQuerySchema.parse({
      userId: url.searchParams.get("userId") ?? undefined,
      entity: url.searchParams.get("entity") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const result = await listAdminAuditLogs(query);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
