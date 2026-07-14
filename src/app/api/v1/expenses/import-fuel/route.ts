import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { importExpenseFromFuelLog } from "@/features/finance/services";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const result = await importExpenseFromFuelLog(
      user.id,
      body,
      clientIp(request),
    );
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
