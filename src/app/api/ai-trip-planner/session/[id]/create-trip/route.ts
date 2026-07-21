import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createTripBodySchema } from "@/features/ai-trip-planner/schemas/session";
import { createTripFromPlanningSession } from "@/features/ai-trip-planner/services/create-from-draft";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const body = await request.json();
    createTripBodySchema.parse(body);
    const result = await createTripFromPlanningSession(
      user.id,
      id,
      clientIp(request),
    );
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
