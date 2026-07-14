import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listRegionalFuelPrices } from "@/features/fuel/services";

export async function GET(request: Request) {
  try {
    await requireActiveUser();
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const data = await listRegionalFuelPrices(query);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
