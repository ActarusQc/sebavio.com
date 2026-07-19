import { NextResponse } from "next/server";

import {
  processStripeWebhook,
  StripeWebhookAlreadyProcessingError,
  StripeWebhookSignatureError,
} from "@/services/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — corps brut obligatoire pour la vérification de signature.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  try {
    const result = await processStripeWebhook(rawBody, signature);
    if (result.status === "duplicate") {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { received: true, status: result.status },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof StripeWebhookSignatureError) {
      return NextResponse.json(
        { error: "Signature invalide." },
        { status: 400 },
      );
    }
    if (error instanceof StripeWebhookAlreadyProcessingError) {
      return NextResponse.json(
        { received: true, processing: true },
        { status: 200 },
      );
    }
    // Stripe réessaie sur 5xx — ne pas fuiter les détails internes
    return NextResponse.json(
      { error: "Échec de traitement." },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json(
    { error: "Méthode non autorisée." },
    { status: 405 },
  );
}
