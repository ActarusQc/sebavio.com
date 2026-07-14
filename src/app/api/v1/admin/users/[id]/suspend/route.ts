import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { suspendAdminUser } from "@/features/admin/services";
import { adminUserSuspendSchema } from "@/features/admin/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requireAdminUser();
    const { id } = await params;

    let reason: string | undefined;
    const raw = await request.text();
    if (raw.trim()) {
      const body = adminUserSuspendSchema.parse(JSON.parse(raw) as unknown);
      reason = body.reason;
    }

    const user = await suspendAdminUser(id, actor, {
      reason,
      ipAddress: clientIp(request),
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
