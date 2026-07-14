import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { getAdminDashboardStats } from "@/features/admin/services";

/** Alias Doc 6 — mêmes agrégats que /dashboard. */
export async function GET() {
  try {
    await requireAdminUser();
    const statistics = await getAdminDashboardStats();
    return jsonOk({ statistics });
  } catch (error) {
    return handleRouteError(error);
  }
}
