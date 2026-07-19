import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requirePermission } from "@/features/auth/services/session";
import { adminResendVerification } from "@/features/admin/services";
import { adminUserResendVerificationSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requirePermission("users.resend_verification");
    const { id } = await params;
    const body = adminUserResendVerificationSchema.parse(await request.json());

    const result = await adminResendVerification(id, actor, {
      reason: body.reason,
      ipAddress: clientIp(request),
    });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
