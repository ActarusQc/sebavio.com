import { isAppError } from "@/lib/errors";

/**
 * Redirection admin selon le type d'erreur (évite la boucle login ↔ dashboard).
 * Module pur — pas d'import Auth.js (testable unitairement).
 */
export function adminAccessRedirectPath(error: unknown): string {
  if (isAppError(error) && error.status === 401) {
    return "/login";
  }
  return "/forbidden";
}
