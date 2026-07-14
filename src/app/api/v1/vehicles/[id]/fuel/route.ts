import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { createFuelLog, listVehicleFuelLogs } from "@/features/fuel/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const data = await listVehicleFuelLogs(user.id, id, query);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireActiveUser();
    const { id } = await context.params;
    const body = await request.json();
    const fuelLog = await createFuelLog(
      user.id,
      { ...body, vehicleId: id },
      clientIp(request),
    );
    return jsonOk({ fuelLog }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
