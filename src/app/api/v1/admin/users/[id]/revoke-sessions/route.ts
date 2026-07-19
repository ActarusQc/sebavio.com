import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { revokeUserSessions } from "@/features/admin/services";
import { adminUserRevokeSessionsSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.sessions.revoke");
    const { id } = await params;
    const body = adminUserRevokeSessionsSchema.parse(await request.json());

    const result = await revokeUserSessions(id, actor, {
      reason: body.reason,
      allowSelf: body.allowSelf,
      ipAddress: clientIp(request),
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
