"use client";

import type { AiSource } from "@/features/ai/schemas/sources";

export function AssistantSourcesList({ sources }: { sources: AiSource[] }) {
  if (!sources.length) return null;

  return (
    <div className="mt-3 space-y-2" data-testid="ai-sources">
      <p className="text-sebavio-navy text-xs font-semibold tracking-wide uppercase">
        Sources
      </p>
      <ul className="space-y-2">
        {sources.slice(0, 6).map((s) => (
          <li
            key={s.id}
            className="border-border/70 rounded-lg border bg-white/80 px-3 py-2"
          >
            <p className="text-sebavio-navy text-sm font-medium">
              {s.title?.trim() || s.domain}
            </p>
            <p className="text-muted-foreground text-xs">{s.domain}</p>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sebavio-navy mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              Consulter la source
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WebSearchBadge({ used }: { used: boolean }) {
  if (!used) return null;
  return (
    <p
      className="text-muted-foreground mt-1 text-[11px]"
      data-testid="ai-web-search-badge"
    >
      Informations vérifiées en ligne
    </p>
  );
}
