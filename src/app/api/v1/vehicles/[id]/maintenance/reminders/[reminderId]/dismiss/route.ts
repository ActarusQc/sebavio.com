import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { dismissProviderReminder } from "@/features/vehicle-maintenance";

type RouteContext = { params: Promise<{ id: string; reminderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id, reminderId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reminder = await dismissProviderReminder(
      user.id,
      id,
      reminderId,
      body,
    );
    return jsonOk({ reminder });
  } catch (error) {
    return handleRouteError(error);
  }
}
