import { resolveAdminEnvironment } from "@/features/admin/lib/environment";

/** Phrase exacte exigée en production pour confirmer une suspension. */
export function suspendConfirmationPhrase(email: string): string {
  return `SUSPENDRE ${email.trim()}`;
}

/**
 * En production : confirmation obligatoire et exacte.
 * Hors production : si fournie, doit correspondre ; sinon acceptée.
 */
export function isSuspendConfirmationValid(
  email: string,
  confirmation: string | undefined | null,
): boolean {
  const expected = suspendConfirmationPhrase(email);
  const provided = (confirmation ?? "").trim();
  const env = resolveAdminEnvironment();

  if (env === "production") {
    return provided === expected;
  }

  if (!provided) return true;
  return provided === expected;
}
