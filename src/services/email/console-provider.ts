import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

/**
 * Fournisseur console — comportement de développement historique.
 * En production, ne journalise jamais le lien (jeton).
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console" as const;

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[email:console] PRODUCTION — envoi simulé (aucun SMTP). kind=${input.kind} to=${maskEmail(input.to)}`,
      );
      return { ok: true };
    }

    const linkMatch = input.text.match(/https?:\/\/\S+/);
    const link = linkMatch?.[0] ?? "(pas de lien)";
    console.info(
      `[email:console] kind=${input.kind} to=${input.to} link=${link}`,
    );
    return { ok: true };
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "(invalid)";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}
