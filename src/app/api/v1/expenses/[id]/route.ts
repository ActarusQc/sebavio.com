import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/features/finance/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const expense = await getExpenseById(user.id, id);
    return jsonOk({ expense });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const result = await updateExpense(user.id, id, body, clientIp(request));
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    await deleteExpense(user.id, id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
