import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  getTravelerProfile,
  upsertTravelerProfile,
} from "@/features/trips/activities/trip-activity-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const profile = await getTravelerProfile(user.id, id);
    return jsonOk({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const profile = await upsertTravelerProfile(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
