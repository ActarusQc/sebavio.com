import { AppError } from "@/lib/errors";
import type { AppErrorCode } from "@/lib/errors";

export class StripeNotConfiguredError extends AppError {
  constructor(message = "Stripe n'est pas configuré sur ce serveur.") {
    super("STRIPE_001", message, 503);
    this.name = "StripeNotConfiguredError";
  }
}

export class StripeObjectNotFoundError extends AppError {
  constructor(message = "Objet Stripe introuvable.") {
    super("STRIPE_002", message, 404);
    this.name = "StripeObjectNotFoundError";
  }
}

export class StripeModeMismatchError extends AppError {
  constructor(
    message = "Le mode Stripe (test/live) ne correspond pas à la clé secrète.",
  ) {
    super("STRIPE_003", message, 500);
    this.name = "StripeModeMismatchError";
  }
}

export class StripeSyncError extends AppError {
  constructor(message = "Échec de la synchronisation Stripe.") {
    super("STRIPE_004", message, 502);
    this.name = "StripeSyncError";
  }
}

export class StripeWebhookSignatureError extends AppError {
  constructor(message = "Signature webhook Stripe invalide.") {
    super("STRIPE_005", message, 400);
    this.name = "StripeWebhookSignatureError";
  }
}

export class StripeWebhookAlreadyProcessingError extends AppError {
  constructor(
    message = "Cet événement webhook est déjà en cours de traitement.",
  ) {
    super("STRIPE_006", message, 409);
    this.name = "StripeWebhookAlreadyProcessingError";
  }
}

export class StripeRefundNotAllowedError extends AppError {
  constructor(message = "Remboursement non autorisé pour ce paiement.") {
    super("STRIPE_007", message, 400);
    this.name = "StripeRefundNotAllowedError";
  }
}

export class StripeSubscriptionActionNotAllowedError extends AppError {
  constructor(message = "Action d'abonnement non autorisée dans cet état.") {
    super("STRIPE_008", message, 400);
    this.name = "StripeSubscriptionActionNotAllowedError";
  }
}

export class StripeSebavioProductError extends AppError {
  constructor(
    message = "Produit Stripe non géré par Sebavio ou métadonnées invalides.",
  ) {
    super("STRIPE_009", message, 400);
    this.name = "StripeSebavioProductError";
  }
}

export function isStripeAppError(error: unknown): error is AppError {
  return (
    error instanceof AppError &&
    typeof error.code === "string" &&
    (error.code as AppErrorCode).startsWith("STRIPE_")
  );
}
