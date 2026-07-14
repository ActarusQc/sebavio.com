import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { setPrimaryVehicle } from "@/features/vehicles/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const vehicle = await setPrimaryVehicle(user.id, id, clientIp(request));
    return jsonOk({ vehicle });
  } catch (error) {
    return handleRouteError(error);
  }
}
