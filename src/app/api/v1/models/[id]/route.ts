import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  requireActiveUser,
  requireAdminUser,
} from "@/features/auth/services/session";
import { getModelById, updateModel } from "@/features/vehicle-catalog/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const model = await getModelById(id);
    return jsonOk({ model });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const model = await updateModel(id, body, admin.id, clientIp(request));
    return jsonOk({ model });
  } catch (error) {
    return handleRouteError(error);
  }
}
