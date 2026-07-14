import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { deletePet, updatePet } from "@/features/travel-groups/services";

type RouteContext = { params: Promise<{ id: string; petId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, petId } = await context.params;
    const body = await request.json();
    const pet = await updatePet(user.id, id, petId, body, clientIp(request));
    return jsonOk({ pet });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, petId } = await context.params;
    await deletePet(user.id, id, petId, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
