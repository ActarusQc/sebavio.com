"use client";

import Image from "next/image";
import { Sparkles, Star } from "lucide-react";
import { getItineraryTypeLabel } from "@/features/ai-trip-planner/lib/labels";
import type { AiSuggestion } from "@/features/ai-trip-planner/types";

type Props = {
  suggestions: AiSuggestion[];
};

export function AISuggestions({ suggestions }: Props) {
  const visible = suggestions.filter((s) => s.accepted !== false).slice(0, 3);
  if (!visible.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sebavio-navy flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="text-sebavio-gold size-3.5" aria-hidden />
          Suggestions IA
        </h3>
      </div>
      <ul className="space-y-2.5">
        {visible.map((item) => (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-[#e8eef3] bg-[#fafbfc]"
          >
            <div className="flex gap-3 p-2.5">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#eef3f8]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                  />
                ) : (
                  <div className="text-sebavio-gold flex h-full w-full items-center justify-center">
                    <Star className="size-5" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sebavio-navy truncate text-sm font-semibold">
                  {item.name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#9a7a2f]">
                  {getItineraryTypeLabel(item.category)}
                </p>
                {item.justification ? (
                  <p className="text-sebavio-slate mt-1 line-clamp-2 text-xs">
                    {item.justification}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
