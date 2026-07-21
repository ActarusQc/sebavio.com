"use client";

import { Sparkles, User } from "lucide-react";
import { AIQuickReplies } from "@/features/ai-trip-planner/components/ai-quick-replies";
import { formatMessageTime } from "@/features/ai-trip-planner/lib/format";
import type { PlannerMessage } from "@/features/ai-trip-planner/types";
import { cn } from "@/lib/utils";

type Props = {
  message: PlannerMessage;
  showQuickReplies?: boolean;
  onQuickReply?: (reply: string) => void;
  quickRepliesDisabled?: boolean;
};

export function AITripMessage({
  message,
  showQuickReplies,
  onQuickReply,
  quickRepliesDisabled,
}: Props) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "flex w-full gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
      aria-label={isUser ? "Votre message" : "Message de l’assistant"}
    >
      <div
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "text-sebavio-navy bg-[#e8eef5]"
            : "text-sebavio-gold bg-[#f5efe4]",
        )}
        aria-hidden
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </div>
      <div
        className={cn(
          "max-w-[min(100%,32rem)] space-y-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "text-sebavio-navy rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-md bg-[#e8eef5]"
              : "rounded-tl-md bg-[#f7f1e7]",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p
          className={cn(
            "text-sebavio-slate/80 px-1 text-[0.7rem]",
            isUser ? "text-right" : "text-left",
          )}
        >
          <time dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
        </p>
        {showQuickReplies && message.quickReplies?.length && onQuickReply ? (
          <AIQuickReplies
            replies={message.quickReplies}
            onSelect={onQuickReply}
            disabled={quickRepliesDisabled}
          />
        ) : null}
      </div>
    </article>
  );
}
