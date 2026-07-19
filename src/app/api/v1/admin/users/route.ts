import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { listAdminUsers } from "@/features/admin/services";
import { adminUserListQuerySchema } from "@/features/admin/schemas";

export async function GET(request: Request) {
  try {
    await requirePermission("users.read");
    const url = new URL(request.url);
    const query = adminUserListQuerySchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      role: url.searchParams.get("role") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    const result = await listAdminUsers(query);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
