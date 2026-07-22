"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MultiSelectChoice = {
  id: string;
  label: string;
};

type Props = {
  choices: MultiSelectChoice[];
  confirmLabel?: string;
  anyLabel?: string;
  noneLabel?: string;
  minimumSelections?: number;
  maximumSelections?: number | null;
  disabled?: boolean;
  readOnly?: boolean;
  initialSelectedIds?: string[];
  onConfirm: (selected: MultiSelectChoice[]) => void;
  onAny?: () => void;
  onNone?: () => void;
};

export function AIPlannerMultiSelect({
  choices,
  confirmLabel = "Continuer avec mes choix",
  anyLabel = "Tout me convient",
  noneLabel = "Aucun intérêt particulier",
  minimumSelections = 1,
  maximumSelections = null,
  disabled,
  readOnly,
  initialSelectedIds = [],
  onConfirm,
  onAny,
  onNone,
}: Props) {
  const groupId = useId();
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [noneSelected, setNoneSelected] = useState(false);

  const toggle = (id: string) => {
    if (disabled || readOnly) return;
    setNoneSelected(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (maximumSelections != null && prev.length >= maximumSelections) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const canConfirm =
    noneSelected ||
    (selected.length >= minimumSelections &&
      (maximumSelections == null || selected.length <= maximumSelections));

  const selectedChoices = choices.filter((c) => selected.includes(c.id));

  return (
    <div
      className="mt-3 space-y-3"
      role="group"
      aria-labelledby={`${groupId}-label`}
    >
      <p id={`${groupId}-label`} className="sr-only">
        Sélection multiple
      </p>

      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const isOn = selected.includes(choice.id) && !noneSelected;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled || readOnly}
              aria-pressed={isOn}
              onClick={() => toggle(choice.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  toggle(choice.id);
                }
              }}
              className={cn(
                "focus-visible:ring-sebavio-navy/40 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none",
                isOn
                  ? "border-sebavio-teal/50 text-sebavio-navy bg-[#e8f6f4]"
                  : "text-sebavio-navy hover:border-sebavio-gold/60 border-[#d7e0ea] bg-white hover:bg-[#fff9ef]",
                (disabled || readOnly) && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                  isOn
                    ? "border-sebavio-teal bg-sebavio-teal text-white"
                    : "border-[#c5d0db] bg-white",
                )}
                aria-hidden
              >
                {isOn ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              {choice.label}
            </button>
          );
        })}
      </div>

      {!readOnly ? (
        <div className="flex flex-wrap gap-2">
          {onAny ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onAny}
              className="text-sebavio-navy focus-visible:ring-sebavio-navy/40 rounded-full border border-[#d7e0ea] bg-white px-3.5 py-1.5 text-sm font-medium hover:bg-[#fff9ef] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
            >
              {anyLabel}
            </button>
          ) : null}
          <button
            type="button"
            disabled={disabled}
            aria-pressed={noneSelected}
            onClick={() => {
              setSelected([]);
              setNoneSelected(true);
              onNone?.();
            }}
            className={cn(
              "focus-visible:ring-sebavio-navy/40 rounded-full border px-3.5 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
              noneSelected
                ? "border-sebavio-teal/50 text-sebavio-navy bg-[#e8f6f4]"
                : "text-sebavio-navy border-[#d7e0ea] bg-white hover:bg-[#fff9ef]",
            )}
          >
            {noneLabel}
          </button>
        </div>
      ) : null}

      {selectedChoices.length > 0 && !noneSelected ? (
        <p className="text-sebavio-slate text-xs">
          Sélection : {selectedChoices.map((c) => c.label).join(" · ")}
        </p>
      ) : null}

      {!readOnly ? (
        <Button
          type="button"
          size="sm"
          disabled={disabled || !canConfirm}
          onClick={() => {
            if (noneSelected) {
              onConfirm([]);
              return;
            }
            onConfirm(selectedChoices);
          }}
          className="bg-sebavio-navy hover:bg-sebavio-navy/90 h-9 text-white"
        >
          {confirmLabel}
        </Button>
      ) : null}
    </div>
  );
}
