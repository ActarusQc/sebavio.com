import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { postponeReminder } from "@/features/maintenance/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reminder = await postponeReminder(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk({ reminder });
  } catch (error) {
    return handleRouteError(error);
  }
}
