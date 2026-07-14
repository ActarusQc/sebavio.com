import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { reactivateAdminUser } from "@/features/admin/services";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const actor = await requireAdminUser();
    const { id } = await params;
    const user = await reactivateAdminUser(id, actor, {
      ipAddress: clientIp(request),
    });
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
