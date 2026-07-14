import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/services/email";
import { isEmailTypeAllowed } from "@/features/notifications/services/preferences";
import type { CreateInAppInput } from "@/features/notifications/types";

export type EmailChannelResult =
  "sent" | "skipped_prefs" | "exists" | "no_user_email" | "failed";

/**
 * Canal email : honore email_* ; anti-doublon channel=email + dedupe_key.
 * Soft-fail : jamais d'exception. Persiste la ligne email seulement après envoi OK
 * (permet un retry au prochain dispatch si SMTP a échoué).
 */
export async function dispatchEmailChannel(
  input: Pick<
    CreateInAppInput,
    | "userId"
    | "type"
    | "title"
    | "body"
    | "dedupeKey"
    | "href"
    | "priority"
    | "sourceEntity"
    | "sourceId"
  >,
): Promise<EmailChannelResult> {
  const allowed = await isEmailTypeAllowed(input.userId, input.type);
  if (!allowed) {
    return "skipped_prefs";
  }

  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      channel: "email",
      dedupeKey: input.dedupeKey,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (existing) {
    return "exists";
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
    select: { email: true },
  });
  if (!user?.email) {
    return "no_user_email";
  }

  const result = await sendNotificationEmail({
    to: user.email,
    title: input.title,
    body: input.body,
    href: input.href,
  });

  if (!result.ok) {
    return "failed";
  }

  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: "email",
        title: input.title,
        body: input.body,
        priority: input.priority ?? "normal",
        dedupeKey: input.dedupeKey,
        sourceEntity: input.sourceEntity ?? null,
        sourceId: input.sourceId ?? null,
        href: input.href ?? null,
        readAt: new Date(),
      },
    });
  } catch {
    // Course unique partielle : considérer comme déjà envoyé.
    return "exists";
  }

  return "sent";
}
