import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { listReminders } from "@/features/maintenance/services";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const reminders = await listReminders(user.id);
    return jsonOk({ reminders });
  } catch (error) {
    return handleRouteError(error);
  }
}
