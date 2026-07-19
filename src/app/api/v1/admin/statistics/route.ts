import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { getAdminDashboardStats } from "@/features/admin/services";

/** Alias Doc 6 — mêmes agrégats que /dashboard. */
export async function GET() {
  try {
    await requirePermission("admin.dashboard");
    const statistics = await getAdminDashboardStats();
    return jsonOk({ statistics });
  } catch (error) {
    return handleRouteError(error);
  }
}
