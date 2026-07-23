import { z } from "zod";
import { getRedis } from "@/lib/redis";
import { AppError } from "@/lib/errors";
import { sendContactEmail } from "@/services/email";
import {
  getContactInboxEmail,
  OFFICIAL_PUBLIC_EMAIL,
} from "../lib/public-contact";
import { CONTACT_PAGE } from "../lib/trust-content";

const CONTACT_RATE_LIMIT_MAX = 5;
const CONTACT_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom (au moins 2 caractères).")
    .max(120, "Le nom est trop long."),
  email: z
    .string()
    .trim()
    .email("Indiquez une adresse courriel valide.")
    .max(254),
  category: z
    .string()
    .trim()
    .min(1, "Choisissez un sujet.")
    .refine(
      (value) => (CONTACT_PAGE.subjects as readonly string[]).includes(value),
      {
        message: "Sujet invalide.",
      },
    ),
  message: z
    .string()
    .trim()
    .min(20, "Le message doit contenir au moins 20 caractères.")
    .max(4000, "Le message est trop long (4000 caractères maximum)."),
  consent: z.literal("on", {
    error: "Le consentement est requis pour envoyer le message.",
  }),
  /** Champ piège antirobot — si rempli, succès silencieux (pas d’envoi). */
  company: z.string().optional(),
});

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function assertContactRateLimit(
  ip: string,
  email: string,
): Promise<void> {
  const key = `contact:form:${ip}:${email.toLowerCase()}`;
  try {
    const redis = getRedis();
    if (redis.status !== "ready") {
      await redis.connect();
    }
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, CONTACT_RATE_LIMIT_WINDOW_SECONDS);
    }
    if (count > CONTACT_RATE_LIMIT_MAX) {
      throw new AppError(
        "AUTH_RATE_LIMIT",
        "Trop de messages envoyés. Réessayez plus tard.",
        429,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "AUTH_UNAVAILABLE",
      "Service temporairement indisponible. Réessayez plus tard.",
      503,
    );
  }
}

function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Envoi d’un message de contact.
 * Ne journalise pas le corps complet du message.
 */
export async function submitContactMessage(
  formData: FormData,
  headers: Headers,
): Promise<ContactActionResult> {
  const inbox = getContactInboxEmail();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    category: formData.get("category"),
    message: formData.get("message"),
    consent: formData.get("consent") ?? undefined,
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Vérifiez les champs du formulaire.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  if (data.company) {
    return { ok: true };
  }

  try {
    await assertContactRateLimit(clientIpFromHeaders(headers), data.email);
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Service temporairement indisponible. Réessayez plus tard.";
    return { ok: false, error: message };
  }

  const result = await sendContactEmail({
    to: inbox,
    visitorName: data.name,
    visitorEmail: data.email,
    category: data.category,
    message: data.message,
  });

  if (!result.ok) {
    console.error("[contact] échec envoi (détails SMTP omis)");
    return {
      ok: false,
      error: `Le message n’a pas pu être envoyé pour le moment. Veuillez réessayer plus tard ou écrire à ${OFFICIAL_PUBLIC_EMAIL}.`,
    };
  }

  return { ok: true };
}
