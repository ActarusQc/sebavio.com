import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import {
  deleteActivity,
  getActivityById,
  updateActivity,
} from "@/features/activities/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminUser();
    const { id } = await context.params;
    const activity = await getActivityById(id, true);
    return jsonOk({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const activity = await updateActivity(
      id,
      body,
      admin.id,
      clientIp(request),
    );
    return jsonOk({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    await deleteActivity(id, admin.id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
