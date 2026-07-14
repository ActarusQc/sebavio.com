import { requireActiveUser } from "@/features/auth/services/session";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import {
  createManufacturer,
  listManufacturers,
} from "@/features/vehicle-catalog/services";

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
    const data = await listManufacturers(queryFromUrl(new URL(request.url)));
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const manufacturer = await createManufacturer(
      body,
      admin.id,
      clientIp(request),
    );
    return jsonOk({ manufacturer }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
