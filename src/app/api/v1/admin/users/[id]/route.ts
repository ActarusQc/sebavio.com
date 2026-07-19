import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  requirePermission,
  requireSuperAdminUser,
} from "@/features/auth/services/session";
import {
  changeAdminUserRole,
  getAdminUserById,
} from "@/features/admin/services";
import { adminUserRolePatchSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission("users.read");
    const { id } = await params;
    const user = await getAdminUserById(id);
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser();
    const { id } = await params;
    const body = adminUserRolePatchSchema.parse(await request.json());
    const user = await changeAdminUserRole(id, body.role, actor, {
      reason: body.reason,
      ipAddress: clientIp(request),
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
