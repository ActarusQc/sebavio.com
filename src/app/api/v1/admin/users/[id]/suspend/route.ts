import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { suspendAdminUser } from "@/features/admin/services";
import { adminUserSuspendSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.suspend");
    const { id } = await params;
    const body = adminUserSuspendSchema.parse(await request.json());

    const user = await suspendAdminUser(id, actor, {
      reason: body.reason,
      suspensionEndsAt: body.suspensionEndsAt,
      ipAddress: clientIp(request),
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
