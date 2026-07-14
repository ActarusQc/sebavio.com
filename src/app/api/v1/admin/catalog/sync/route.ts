import { handleRouteError } from "@/features/auth/services/http";
import { requireAdminUser } from "@/features/auth/services/session";
import { syncCatalog } from "@/features/vehicle-catalog/services";

export async function POST() {
  try {
    await requireAdminUser();
    await syncCatalog();
  } catch (error) {
    return handleRouteError(error);
  }
}
