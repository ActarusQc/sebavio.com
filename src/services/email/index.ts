/**
 * Abstraction envoi courriel.
 * Dev : journalise le lien (tokens) dans la console serveur.
 * Production : log de lien INTERDIT.
 */

export type AuthEmailKind = "verify-email" | "reset-password";

export type SendAuthEmailInput = {
  to: string;
  kind: AuthEmailKind;
  link: string;
};

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // Stub production : aucun envoi réel ni log de jeton.
    // L'intégration SMTP sera branchée ultérieurement.
    return;
  }

  // Développement uniquement — permet de tester inscription / reset.
  console.info(
    `[email:stub] kind=${input.kind} to=${input.to} link=${input.link}`,
  );
}
