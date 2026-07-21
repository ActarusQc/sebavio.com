import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  addActivityToTrip,
  listTripActivities,
} from "@/features/trips/activities/trip-activity-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const data = await listTripActivities(user.id, id);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const result = await addActivityToTrip(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
