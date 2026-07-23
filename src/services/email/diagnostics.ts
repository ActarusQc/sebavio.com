/**
 * Alertes impossibles à rater si la prod croit envoyer des courriels
 * alors que le transport réel n'est pas opérationnel.
 */

const BANNER =
  "══════════════════════════════════════════════════════════════════";

export type EmailConfigHealth = {
  /** true si un envoi SMTP réel est possible */
  smtpReady: boolean;
  /** true si NODE_ENV=production et SMTP non prêt */
  productionMisconfigured: boolean;
  providerName: string;
};

export function assessEmailConfigHealth(
  providerName: string,
  smtpReady: boolean,
): EmailConfigHealth {
  const isProd = process.env.NODE_ENV === "production";
  return {
    smtpReady,
    productionMisconfigured: isProd && !smtpReady,
    providerName,
  };
}

export function logProductionEmailMisconfiguration(context: string): void {
  console.error(BANNER);
  console.error(
    `[email:CRITICAL] PRODUCTION SANS SMTP OPÉRATIONNEL — ${context}`,
  );
  console.error(
    "[email:CRITICAL] Les courriels ne partent PAS. Vérifiez EMAIL_PROVIDER=smtp,",
  );
  console.error(
    "[email:CRITICAL] SMTP_HOST/PORT/USER/PASSWORD et EMAIL_FROM (expéditeur autorisé SMTP2GO).",
  );
  console.error(BANNER);
}
