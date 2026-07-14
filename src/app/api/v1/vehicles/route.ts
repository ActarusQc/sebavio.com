import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createVehicle, listVehicles } from "@/features/vehicles/services";

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
    const data = await listVehicles(
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
    const vehicle = await createVehicle(user.id, body, clientIp(request));
    return jsonOk({ vehicle }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
