import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  abandonSession,
  getOwnedSessionOrThrow,
  restartSession,
} from "@/features/ai-trip-planner/services/sessions";
import { toSessionDto } from "@/features/ai-trip-planner/services/dto";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const session = await getOwnedSessionOrThrow(user.id, id);
    return jsonOk({ session: toSessionDto(session) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;
    const url = new URL(request.url);
    const restart = url.searchParams.get("restart") === "1";
    if (restart) {
      const session = await restartSession(user.id, id);
      return jsonOk({ session });
    }
    await abandonSession(user.id, id);
    return jsonOk({ abandoned: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
