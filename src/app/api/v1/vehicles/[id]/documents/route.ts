import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { addVehicleDocument } from "@/features/vehicles/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const document = await addVehicleDocument(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk({ document }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
