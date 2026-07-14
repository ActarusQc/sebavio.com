import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getTripFinanceSummary } from "@/features/finance/services";

type RouteContext = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { tripId } = await context.params;
    const summary = await getTripFinanceSummary(user.id, tripId);
    return jsonOk({ summary });
  } catch (error) {
    return handleRouteError(error);
  }
}
