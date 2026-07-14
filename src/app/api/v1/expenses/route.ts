import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createExpense, listExpenses } from "@/features/finance/services";

function queryFromUrl(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function GET(request: Request) {
  try {
    const user = await requireActiveUser();
    const data = await listExpenses(
      user.id,
      queryFromUrl(new URL(request.url)),
    );
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const body = await request.json();
    const result = await createExpense(user.id, body, clientIp(request));
    return jsonOk(result, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
