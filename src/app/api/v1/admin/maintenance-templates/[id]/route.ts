import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import {
  deleteTemplate,
  updateTemplate,
} from "@/features/maintenance/services";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    const body = await request.json();
    const template = await updateTemplate(
      id,
      body,
      admin.id,
      clientIp(request),
    );
    return jsonOk({ template });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminUser();
    const { id } = await context.params;
    await deleteTemplate(id, admin.id, clientIp(request));
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
