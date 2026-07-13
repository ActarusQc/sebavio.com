import { signOut } from "@/lib/auth";
import { requireActiveUser } from "@/features/auth/services/session";
import { writeAuditLog } from "@/features/auth/services/audit";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser().catch(() => null);

    await signOut({ redirect: false });

    if (user) {
      await writeAuditLog({
        userId: user.id,
        entity: "auth",
        entityId: user.id,
        action: "logout",
        ipAddress: clientIp(request),
      });
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
