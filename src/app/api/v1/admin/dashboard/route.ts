import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { getAdminDashboardStats } from "@/features/admin/services";

export async function GET() {
  try {
    await requirePermission("admin.dashboard");
    const stats = await getAdminDashboardStats();
    return jsonOk({ stats });
  } catch (error) {
    return handleRouteError(error);
  }
}
