import { requireActiveUser } from "@/features/auth/services/session";
import { signOut } from "@/lib/auth";
import {
  handleRouteError,
  jsonFail,
  jsonOk,
} from "@/features/auth/services/http";
import { AUTH_JWT_MAX_AGE_SECONDS } from "@/lib/constants";
import { isAppError } from "@/lib/errors";

/**
 * Renouvellement / contrôle session : re-vérifie le status en base.
 * Compte suspendu → déconnexion immédiate.
 */
export async function POST() {
  try {
    const user = await requireActiveUser();
    return jsonOk({
      refreshed: true,
      maxAgeSeconds: AUTH_JWT_MAX_AGE_SECONDS,
      user,
    });
  } catch (error) {
    if (
      isAppError(error) &&
      (error.code === "AUTH_003" || error.code === "AUTH_006")
    ) {
      await signOut({ redirect: false });
      return jsonFail(error.code, error.message, error.status);
    }
    return handleRouteError(error);
  }
}
