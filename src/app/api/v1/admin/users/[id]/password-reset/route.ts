import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { adminSendPasswordReset } from "@/features/admin/services";
import { adminUserPasswordResetSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.password.reset");
    const { id } = await params;
    const body = adminUserPasswordResetSchema.parse(await request.json());

    const result = await adminSendPasswordReset(id, actor, {
      reason: body.reason,
      ipAddress: clientIp(request),
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
