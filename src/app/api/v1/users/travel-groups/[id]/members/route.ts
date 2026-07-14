import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { addMember } from "@/features/travel-groups/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const member = await addMember(user.id, id, body, clientIp(request));
    return jsonOk({ member }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
