import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  deleteVehicle,
  getVehicleById,
  updateVehicle,
} from "@/features/vehicles/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const vehicle = await getVehicleById(user.id, id);
    return jsonOk({ vehicle });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const vehicle = await updateVehicle(user.id, id, body, clientIp(request));
    return jsonOk({ vehicle });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await deleteVehicle(user.id, id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
