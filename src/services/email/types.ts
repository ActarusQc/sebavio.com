export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Diagnostic only — never logged with token/body. */
  kind: string;
};

export type SendEmailResult = { ok: true } | { ok: false; reason: string };

export interface EmailProvider {
  readonly name: "console" | "smtp";
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

export type AuthEmailKind = "verify-email" | "reset-password";

export type SendAuthEmailInput = {
  to: string;
  kind: AuthEmailKind;
  link: string;
};

export type SendNotificationEmailInput = {
  to: string;
  title: string;
  body: string;
  href?: string | null;
};
