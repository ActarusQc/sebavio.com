/**
 * Abstraction envoi courriel — SMTP (SMTP2GO) ou console (dev).
 * Sélection : EMAIL_PROVIDER=console|smtp
 *   — défaut développement : console
 *   — défaut production : smtp
 * L'échec d'envoi ne remonte JAMAIS d'exception aux appelants métier.
 */

import { ConsoleEmailProvider } from "./console-provider";
import {
  assessEmailConfigHealth,
  logProductionEmailMisconfiguration,
} from "./diagnostics";
import { SmtpEmailProvider, readSmtpConfigFromEnv } from "./smtp-provider";
import {
  buildAuthEmailContent,
  buildNotificationEmailContent,
} from "./templates";
import type {
  EmailProvider,
  SendAuthEmailInput,
  SendEmailResult,
  SendNotificationEmailInput,
} from "./types";

export type {
  AuthEmailKind,
  EmailProvider,
  SendAuthEmailInput,
  SendEmailResult,
  SendNotificationEmailInput,
} from "./types";

export {
  assessEmailConfigHealth,
  logProductionEmailMisconfiguration,
} from "./diagnostics";

/** Compteur process-local pour diagnostic (tests / ops). */
export const emailSendStats = {
  attempts: 0,
  successes: 0,
  failures: 0,
};

let providerOverride: EmailProvider | null = null;
let startupWarned = false;

export function setEmailProviderForTests(provider: EmailProvider | null): void {
  providerOverride = provider;
}

export function resetEmailSendStats(): void {
  emailSendStats.attempts = 0;
  emailSendStats.successes = 0;
  emailSendStats.failures = 0;
}

function defaultProviderName(): "console" | "smtp" {
  if (process.env.NODE_ENV === "production") {
    return "smtp";
  }
  return "console";
}

function normalizeProviderName(raw: string | undefined): "console" | "smtp" {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "smtp") return "smtp";
  if (value === "console") return "console";
  return defaultProviderName();
}

export function isSmtpConfigured(): boolean {
  return readSmtpConfigFromEnv() !== null;
}

/**
 * Factory — si smtp demandé mais config incomplète → console + alerte.
 */
export function createEmailProviderFromEnv(): EmailProvider {
  const name = normalizeProviderName(process.env.EMAIL_PROVIDER);

  if (name === "smtp") {
    const config = readSmtpConfigFromEnv();
    if (!config) {
      return new ConsoleEmailProvider();
    }
    return new SmtpEmailProvider(config);
  }

  return new ConsoleEmailProvider();
}

function resolveProvider(): EmailProvider {
  return providerOverride ?? createEmailProviderFromEnv();
}

function smtpActuallyReady(provider: EmailProvider): boolean {
  return provider.name === "smtp" && isSmtpConfigured();
}

/** À appeler au démarrage (instrumentation) — alerte prod sans SMTP. */
export function warnIfProductionEmailMisconfigured(): void {
  if (startupWarned) return;
  startupWarned = true;

  const provider = resolveProvider();
  const health = assessEmailConfigHealth(
    provider.name,
    smtpActuallyReady(provider),
  );

  if (health.productionMisconfigured) {
    logProductionEmailMisconfiguration("démarrage applicatif");
  }
}

/** Réinitialisable en tests. */
export function resetEmailStartupWarningFlag(): void {
  startupWarned = false;
}

function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3050"
  );
}

async function deliver(
  kind: string,
  payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  },
): Promise<SendEmailResult> {
  emailSendStats.attempts += 1;

  const provider = resolveProvider();
  const ready = smtpActuallyReady(provider);

  if (
    process.env.NODE_ENV === "production" &&
    !ready &&
    providerOverride === null
  ) {
    logProductionEmailMisconfiguration(`tentative d'envoi kind=${kind}`);
  }

  try {
    const result = await provider.send({ ...payload, kind });
    if (result.ok) {
      emailSendStats.successes += 1;
      return result;
    }
    emailSendStats.failures += 1;
    console.error(
      `[email] échec envoi kind=${kind} provider=${provider.name} reason=${result.reason}`,
    );
    return result;
  } catch (error) {
    emailSendStats.failures += 1;
    const reason = error instanceof Error ? error.message : "unknown";
    console.error(
      `[email] exception envoi kind=${kind} provider=${provider.name} reason=${reason.slice(0, 200)}`,
    );
    return { ok: false, reason };
  }
}

/**
 * Courriel auth (vérification / reset). Soft-fail : jamais d'exception.
 */
export async function sendAuthEmail(
  input: SendAuthEmailInput,
): Promise<SendEmailResult> {
  try {
    const content = buildAuthEmailContent(input.kind, input.link);
    return await deliver(input.kind, {
      to: input.to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  } catch (error) {
    emailSendStats.failures += 1;
    const reason = error instanceof Error ? error.message : "unknown";
    console.error(`[email] échec préparation auth kind=${input.kind}`);
    return { ok: false, reason };
  }
}

/**
 * Courriel notification métier. Soft-fail : jamais d'exception.
 */
export async function sendNotificationEmail(
  input: SendNotificationEmailInput,
): Promise<SendEmailResult> {
  try {
    const content = buildNotificationEmailContent({
      title: input.title,
      body: input.body,
      href: input.href,
      appBaseUrl: appBaseUrl(),
    });
    return await deliver("notification", {
      to: input.to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
  } catch (error) {
    emailSendStats.failures += 1;
    const reason = error instanceof Error ? error.message : "unknown";
    console.error("[email] échec préparation notification");
    return { ok: false, reason };
  }
}
