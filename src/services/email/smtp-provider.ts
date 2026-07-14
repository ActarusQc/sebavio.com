import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

const SMTP_TIMEOUT_MS = 10_000;

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  replyTo?: string;
};

export function readSmtpConfigFromEnv(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const password = process.env.SMTP_PASSWORD?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";
  const portRaw = process.env.SMTP_PORT?.trim() ?? "587";
  const port = Number.parseInt(portRaw, 10);
  const secure =
    (process.env.SMTP_SECURE?.trim() ?? "false").toLowerCase() === "true";
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || undefined;

  if (!host || !user || !password || !from || !Number.isFinite(port)) {
    return null;
  }

  return { host, port, secure, user, password, from, replyTo };
}

export class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp" as const;
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly replyTo?: string;

  constructor(config: SmtpConfig) {
    this.from = config.from;
    this.replyTo = config.replyTo;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: input.to,
        replyTo: this.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "smtp_send_failed";
      return { ok: false, reason: reason.slice(0, 200) };
    }
  }
}
