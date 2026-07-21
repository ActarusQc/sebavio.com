"use client";

type Props = {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
};

export function AIQuickReplies({ replies, onSelect, disabled }: Props) {
  if (!replies.length) return null;

  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      role="group"
      aria-label="Réponses rapides"
    >
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          className="text-sebavio-navy hover:border-sebavio-gold/60 focus-visible:ring-sebavio-navy/40 rounded-full border border-[#d7e0ea] bg-white px-3.5 py-1.5 text-left text-sm font-medium transition hover:bg-[#fff9ef] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
