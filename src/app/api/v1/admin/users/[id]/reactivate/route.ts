import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { reactivateAdminUser } from "@/features/admin/services";
import { adminUserReactivateSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.suspend");
    const { id } = await params;
    const body = adminUserReactivateSchema.parse(await request.json());
    const user = await reactivateAdminUser(id, actor, {
      reason: body.reason,
      ipAddress: clientIp(request),
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
