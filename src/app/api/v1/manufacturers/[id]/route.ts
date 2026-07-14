import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import {
  requireActiveUser,
  requireAdminUser,
} from "@/features/auth/services/session";
import {
  getManufacturerById,
  updateManufacturer,
} from "@/features/vehicle-catalog/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireActiveUser();
    const { id } = await context.params;
    const manufacturer = await getManufacturerById(id);
    return jsonOk({ manufacturer });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const manufacturer = await updateManufacturer(
      id,
      body,
      admin.id,
      clientIp(request),
    );
    return jsonOk({ manufacturer });
  } catch (error) {
    return handleRouteError(error);
  }
}
