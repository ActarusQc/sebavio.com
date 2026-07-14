import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { createTemplate } from "@/features/maintenance/services";

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const template = await createTemplate(body, admin.id, clientIp(request));
    return jsonOk({ template }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
