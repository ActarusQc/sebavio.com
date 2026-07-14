import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { detachActivityFromStop } from "@/features/activities/services";

type RouteContext = {
  params: Promise<{ id: string; stopId: string; activityId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, stopId, activityId } = await context.params;
    await detachActivityFromStop(
      user.id,
      id,
      stopId,
      activityId,
      clientIp(request),
    );
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
