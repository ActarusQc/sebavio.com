import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { deleteMember, updateMember } from "@/features/travel-groups/services";

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, memberId } = await context.params;
    const body = await request.json();
    const member = await updateMember(
      user.id,
      id,
      memberId,
      body,
      clientIp(request),
    );
    return jsonOk({ member });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, memberId } = await context.params;
    await deleteMember(user.id, id, memberId, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
