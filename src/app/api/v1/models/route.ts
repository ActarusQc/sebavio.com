import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  requireActiveUser,
  requireAdminUser,
} from "@/features/auth/services/session";
import { createModel, listModels } from "@/features/vehicle-catalog/services";

function queryFromUrl(url: URL): Record<string, string> {
  const out: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function GET(request: Request) {
  try {
    await requireActiveUser();
    const data = await listModels(queryFromUrl(new URL(request.url)));
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const model = await createModel(body, admin.id, clientIp(request));
    return jsonOk({ model }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
