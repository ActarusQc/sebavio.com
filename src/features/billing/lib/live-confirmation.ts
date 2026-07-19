/**
 * Confirmations renforcées pour actions financières en mode Stripe Live.
 */

export function cancelLiveConfirmationPhrase(email: string): string {
  return `ANNULER ${email.trim()}`;
}

export function refundLiveConfirmationPhrase(
  amountMajor: string,
  currency: string,
): string {
  return `REMBOURSER ${amountMajor} ${currency.trim().toUpperCase()}`;
}

export function isStripeLiveMode(): boolean {
  return (process.env.STRIPE_MODE ?? "test").trim().toLowerCase() === "live";
}

export function getConfiguredStripeMode(): "test" | "live" {
  return isStripeLiveMode() ? "live" : "test";
}

/**
 * En Live : confirmation obligatoire et exacte.
 * En Test : si fournie, doit correspondre ; sinon acceptée.
 */
export function isLiveConfirmationValid(
  expected: string,
  confirmation: string | undefined | null,
  requireLive: boolean,
): boolean {
  const provided = (confirmation ?? "").trim();
  if (requireLive) {
    return provided === expected;
  }
  if (!provided) return true;
  return provided === expected;
}
