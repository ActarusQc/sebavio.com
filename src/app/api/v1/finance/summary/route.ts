import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getFinanceDashboard } from "@/features/finance/services";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const summary = await getFinanceDashboard(user.id);
    return jsonOk({ summary });
  } catch (error) {
    return handleRouteError(error);
  }
}
