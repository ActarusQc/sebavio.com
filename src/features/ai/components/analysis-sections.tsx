"use client";

import type { TripAssistantResponse } from "@/features/ai/schemas/response";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    key: "ok" as const,
    title: "Tout semble correct",
    className: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
  },
  {
    key: "watch" as const,
    title: "À surveiller",
    className: "border-amber-200 bg-amber-50/80 text-amber-950",
  },
  {
    key: "suggestions" as const,
    title: "Suggestions",
    className: "border-sky-200 bg-sky-50/80 text-sky-950",
  },
  {
    key: "missing" as const,
    title: "Informations manquantes",
    className: "border-rose-200 bg-rose-50/80 text-rose-950",
  },
];

export function TripAssistantAnalysis({
  response,
}: {
  response: TripAssistantResponse;
}) {
  const analysis = response.analysis;
  const hasAnalysis =
    analysis &&
    (analysis.ok.length > 0 ||
      analysis.watch.length > 0 ||
      analysis.suggestions.length > 0 ||
      analysis.missing.length > 0);

  const missingFromRoot = response.missingInformation ?? [];

  if (!hasAnalysis && missingFromRoot.length === 0) return null;

  return (
    <div className="grid gap-2" aria-label="Synthèse d’analyse">
      {SECTIONS.map((section) => {
        const items =
          section.key === "missing"
            ? [
                ...(analysis?.missing ?? []),
                ...missingFromRoot.filter(
                  (m) => !(analysis?.missing ?? []).includes(m),
                ),
              ]
            : (analysis?.[section.key] ?? []);
        if (items.length === 0) return null;
        return (
          <section
            key={section.key}
            className={cn("rounded-xl border px-3 py-2", section.className)}
          >
            <h3 className="text-xs font-semibold tracking-wide uppercase">
              {section.title}
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
