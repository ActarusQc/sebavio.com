import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { recalculatePlanningSession } from "@/features/ai-trip-planner/services/planner";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const session = await recalculatePlanningSession(user.id, id);
    return jsonOk({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}
