import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

const SMTP_TIMEOUT_MS = 10_000;

/** Ports SSL implicite (secure=true). Tous les autres utilisent STARTTLS. */
const IMPLICIT_SSL_PORTS = new Set([465, 8465, 443]);

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  user: string;
  password: string;
  from: string;
  replyTo?: string;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw.trim() === "") return fallback;
  return raw.trim().toLowerCase() === "true";
}

export function readSmtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const portRaw = process.env.SMTP_PORT?.trim() ?? "2525";
  const port = Number.parseInt(portRaw, 10);
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  if (!host || !user || !password || !from || !Number.isFinite(port)) {
    return null;
  }

  const implicitSsl = IMPLICIT_SSL_PORTS.has(port);
  const secure = parseBool(process.env.SMTP_SECURE, implicitSsl);
  // STARTTLS obligatoire sur 2525/587 sauf SSL implicite.
  const requireTls = parseBool(
    process.env.SMTP_REQUIRE_TLS,
    !secure && !implicitSsl,
  );

  return { host, port, secure, requireTls, user, password, from, replyTo };
}

export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp" as const;
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly defaultReplyTo?: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.defaultReplyTo = config.replyTo;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTls,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        replyTo: input.replyTo ?? this.defaultReplyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "smtp_send_failed";
      // Ne jamais remonter d’identifiants éventuels dans reason.
      const sanitized = reason
        .replace(/pass(word)?[=:].*/gi, "[redacted]")
        .replace(/auth[^,]{0,40}/gi, "auth[redacted]")
        .slice(0, 200);
      return { ok: false, reason: sanitized };
    }
  }
}
