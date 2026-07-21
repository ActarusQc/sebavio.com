import "server-only";

import { prisma } from "@/lib/prisma";
import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import { tripAssistantResponseSchema } from "@/features/ai/schemas/response";

export type AiMessageDto = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  structuredPayload: TripAssistantResponse | null;
  model: string | null;
  promptVersion: string | null;
  createdAt: string;
};

export type AiConversationDto = {
  id: string;
  tripId: string;
  messages: AiMessageDto[];
};

export async function getOrCreateConversation(
  userId: string,
  tripId: string,
): Promise<{ id: string }> {
  const existing = await prisma.aiConversation.findUnique({
    where: { userId_tripId: { userId, tripId } },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.aiConversation.create({
    data: { userId, tripId },
    select: { id: true },
  });
}

export async function listConversationMessages(
  userId: string,
  tripId: string,
  limit = 50,
): Promise<AiConversationDto | null> {
  const conversation = await prisma.aiConversation.findUnique({
    where: { userId_tripId: { userId, tripId } },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: limit,
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    tripId: conversation.tripId,
    messages: conversation.messages.map((m) => {
      let structured: TripAssistantResponse | null = null;
      if (m.structuredPayload != null) {
        const parsed = tripAssistantResponseSchema.safeParse(
          m.structuredPayload,
        );
        structured = parsed.success ? parsed.data : null;
      }
      return {
        id: m.id,
        role: m.role as AiMessageDto["role"],
        content: m.content,
        structuredPayload: structured,
        model: m.model,
        promptVersion: m.promptVersion,
        createdAt: m.createdAt.toISOString(),
      };
    }),
  };
}

export async function appendConversationMessages(params: {
  conversationId: string;
  userContent: string;
  assistantContent: string;
  structured: TripAssistantResponse;
  model: string | null;
  promptVersion: string;
}): Promise<void> {
  await prisma.$transaction([
    prisma.aiMessage.create({
      data: {
        conversationId: params.conversationId,
        role: "user",
        content: params.userContent,
      },
    }),
    prisma.aiMessage.create({
      data: {
        conversationId: params.conversationId,
        role: "assistant",
        content: params.assistantContent,
        structuredPayload: params.structured,
        model: params.model,
        promptVersion: params.promptVersion,
      },
    }),
    prisma.aiConversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
}

/**
 * Efface la conversation du voyage (messages cascade) pour en démarrer une nouvelle.
 * Retourne l’id effacé le cas échéant (limites Redis conversation).
 */
export async function clearTripAssistantConversation(
  userId: string,
  tripId: string,
): Promise<{ cleared: boolean; conversationId: string | null }> {
  const existing = await prisma.aiConversation.findUnique({
    where: { userId_tripId: { userId, tripId } },
    select: { id: true },
  });
  if (!existing) {
    return { cleared: false, conversationId: null };
  }

  await prisma.aiConversation.delete({
    where: { id: existing.id },
  });

  return { cleared: true, conversationId: existing.id };
}
