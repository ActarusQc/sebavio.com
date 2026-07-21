"use client";

import {
  Compass,
  Coffee,
  Heart,
  Leaf,
  Sparkles,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssistantClarification } from "@/features/ai/schemas/response";
import { cn } from "@/lib/utils";

const OPTION_ICONS: Record<string, typeof Timer> = {
  fast: Timer,
  family: UtensilsCrossed,
  romantic: Heart,
  fine: Sparkles,
  local: Leaf,
  cafe: Coffee,
  any: Compass,
  keep_previous_style: Compass,
  choose_other_style: Compass,
};

export function ClarificationOptions({
  clarification,
  disabled,
  onSelect,
}: {
  clarification: AssistantClarification;
  disabled?: boolean;
  onSelect: (label: string) => void;
}) {
  if (!clarification.required) return null;

  return (
    <div
      className="space-y-2"
      data-testid="trip-assistant-clarification"
      role="group"
      aria-label={clarification.question}
    >
      <p className="text-sebavio-navy text-sm font-medium">
        {clarification.question}
      </p>
      <div className="grid gap-2">
        {clarification.options.map((opt) => {
          const Icon = OPTION_ICONS[opt.id] ?? Compass;
          return (
            <Button
              key={opt.id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "border-sebavio-navy/15 hover:border-sebavio-teal/50 hover:bg-sebavio-teal/5 h-auto justify-start gap-3 px-3 py-2.5 text-left whitespace-normal",
              )}
              onClick={() => onSelect(opt.label)}
            >
              <Icon className="text-sebavio-teal size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="text-sebavio-navy block text-sm font-semibold">
                  {opt.label}
                </span>
                {opt.description ? (
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
