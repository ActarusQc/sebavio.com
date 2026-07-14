import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { getAdminDashboardStats } from "@/features/admin/services";

export async function GET() {
  try {
    await requireAdminUser();
    const stats = await getAdminDashboardStats();
    return jsonOk({ stats });
  } catch (error) {
    return handleRouteError(error);
  }
}
