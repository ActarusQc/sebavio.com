import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { getTripBudget, upsertTripBudget } from "@/features/finance/services";

type RouteContext = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { tripId } = await context.params;
    const budget = await getTripBudget(user.id, tripId);
    return jsonOk({ budget });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { tripId } = await context.params;
    const body = await request.json();
    const budget = await upsertTripBudget(
      user.id,
      tripId,
      body,
      clientIp(request),
    );
    return jsonOk({ budget });
  } catch (error) {
    return handleRouteError(error);
  }
}
