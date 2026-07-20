import { StripeModeMismatchError, StripeNotConfiguredError } from "./errors";

export type StripeMode = "test" | "live";

export type StripeEnvConfig = {
  secretKey: string;
  webhookSecret: string;
  mode: StripeMode;
  dashboardAccountId: string | null;
};

function parseMode(raw: string | undefined): StripeMode {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "test" || value === "live") return value;
  throw new StripeNotConfiguredError(
    "STRIPE_MODE doit être explicitement « test » ou « live ».",
  );
}

function assertKeyMatchesMode(secretKey: string, mode: StripeMode): void {
  const isTestKey = secretKey.startsWith("sk_test_");
  const isLiveKey = secretKey.startsWith("sk_live_");
  if (!isTestKey && !isLiveKey) {
    throw new StripeModeMismatchError(
      "STRIPE_SECRET_KEY doit commencer par sk_test_ ou sk_live_.",
    );
  }
  if (mode === "test" && !isTestKey) {
    throw new StripeModeMismatchError(
      "STRIPE_MODE=test exige une clé sk_test_.",
    );
  }
  if (mode === "live" && !isLiveKey) {
    throw new StripeModeMismatchError(
      "STRIPE_MODE=live exige une clé sk_live_.",
    );
  }
}

/**
 * Variables d'environnement lues pour Stripe (objets de test partiels OK).
 */
export type StripeEnvSource = Partial<
  Record<
    | "STRIPE_SECRET_KEY"
    | "STRIPE_WEBHOOK_SECRET"
    | "STRIPE_MODE"
    | "STRIPE_DASHBOARD_ACCOUNT_ID",
    string | undefined
  >
>;

/**
 * Charge et valide la configuration Stripe serveur.
 * Ne journalise jamais les secrets.
 */
export function loadStripeConfig(
  env: StripeEnvSource | NodeJS.ProcessEnv = process.env,
): StripeEnvConfig {
  const source = env as StripeEnvSource;
  const secretKey = source.STRIPE_SECRET_KEY?.trim() ?? "";
  const webhookSecret = source.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  if (!secretKey || !webhookSecret) {
    throw new StripeNotConfiguredError(
      "STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET sont requis.",
    );
  }

  const mode = parseMode(source.STRIPE_MODE);
  assertKeyMatchesMode(secretKey, mode);

  const dashboardAccountId = source.STRIPE_DASHBOARD_ACCOUNT_ID?.trim() || null;

  return {
    secretKey,
    webhookSecret,
    mode,
    dashboardAccountId,
  };
}

export function getStripeMode(
  env: StripeEnvSource | NodeJS.ProcessEnv = process.env,
): StripeMode {
  return loadStripeConfig(env).mode;
}

export function isStripeConfigured(
  env: StripeEnvSource | NodeJS.ProcessEnv = process.env,
): boolean {
  try {
    loadStripeConfig(env);
    return true;
  } catch {
    return false;
  }
}
