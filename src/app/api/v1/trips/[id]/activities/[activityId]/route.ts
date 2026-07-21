import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  planTripActivity,
  rejectTripActivity,
  removeActivityFromTrip,
  restoreTripActivity,
  toggleStarTripActivity,
} from "@/features/trips/activities/trip-activity-service";

type RouteContext = {
  params: Promise<{ id: string; activityId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, activityId } = await context.params;
    const body = (await request.json()) as {
      action?: string;
      reason?: string;
      plannedDate?: string;
      plannedStartTime?: string;
      plannedEndTime?: string;
      estimatedVisitMinutes?: number;
      sequence?: number;
    };
    const action = body.action ?? "plan";

    if (action === "reject") {
      const activity = await rejectTripActivity(
        user.id,
        id,
        activityId,
        { reason: body.reason },
        clientIp(request),
      );
      return jsonOk({ activity });
    }
    if (action === "restore") {
      const activity = await restoreTripActivity(
        user.id,
        id,
        activityId,
        clientIp(request),
      );
      return jsonOk({ activity });
    }
    if (action === "star" || action === "toggle_star") {
      const activity = await toggleStarTripActivity(
        user.id,
        id,
        activityId,
        clientIp(request),
      );
      return jsonOk({ activity });
    }

    const activity = await planTripActivity(
      user.id,
      id,
      activityId,
      body,
      clientIp(request),
    );
    return jsonOk({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, activityId } = await context.params;
    await removeActivityFromTrip(user.id, id, activityId, clientIp(request));
    return jsonOk({ removed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
