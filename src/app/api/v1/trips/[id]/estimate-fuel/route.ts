import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { estimateTripFuel } from "@/features/fuel/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const estimate = await estimateTripFuel(
      user.id,
      id,
      body,
      clientIp(request),
    );
    return jsonOk({ estimate });
  } catch (error) {
    return handleRouteError(error);
  }
}
