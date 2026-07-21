import type { AiSource } from "@/features/ai/schemas/sources";
import {
  classifySourceType,
  extractDomain,
  isSafeHttpsUrl,
} from "@/features/ai/lib/safe-urls";

export type RawCitation = {
  url?: string | null;
  title?: string | null;
  start_index?: number | null;
  end_index?: number | null;
  type?: string | null;
};

function pushUrl(
  out: RawCitation[],
  url: unknown,
  title: unknown = null,
): void {
  if (typeof url !== "string" || !url.trim()) return;
  out.push({
    url: url.trim(),
    title: typeof title === "string" ? title : null,
  });
}

/**
 * Extrait citations globales + annotations url_citation + liens Markdown.
 */
export function extractCitationsFromXaiResponse(response: {
  citations?: unknown;
  output?: unknown;
  output_text?: unknown;
}): RawCitation[] {
  const out: RawCitation[] = [];

  if (Array.isArray(response.citations)) {
    for (const c of response.citations) {
      if (typeof c === "string") pushUrl(out, c);
      else if (c && typeof c === "object") {
        const obj = c as Record<string, unknown>;
        pushUrl(
          out,
          typeof obj.url === "string"
            ? obj.url
            : typeof obj.uri === "string"
              ? obj.uri
              : null,
          obj.title,
        );
      }
    }
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const content = rec.content;
      if (!Array.isArray(content)) continue;
      for (const block of content) {
        if (!block || typeof block !== "object") continue;
        const b = block as Record<string, unknown>;
        const annotations = b.annotations;
        if (Array.isArray(annotations)) {
          for (const ann of annotations) {
            if (!ann || typeof ann !== "object") continue;
            const a = ann as Record<string, unknown>;
            if (a.type != null && a.type !== "url_citation") continue;
            pushUrl(out, a.url, a.title);
          }
        }
      }
    }
  }

  if (typeof response.output_text === "string") {
    extractMarkdownUrls(response.output_text, out);
  }

  return out;
}

function extractMarkdownUrls(text: string, out: RawCitation[]): void {
  // [[1]](https://...) ou [label](https://...)
  const re =
    /\[\[?\d*\]?\]\((https:\/\/[^)\s]+)\)|\[[^\]]+\]\((https:\/\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    pushUrl(out, m[1] || m[2]);
  }
  // URLs brutes https dans le JSON sources
  const raw = /https:\/\/[^\s"'<>\\]+/g;
  while ((m = raw.exec(text)) !== null) {
    const url = m[0].replace(/[),.;]+$/, "");
    pushUrl(out, url);
  }
}

export function citationsToAiSources(
  citations: RawCitation[],
  max = 12,
): AiSource[] {
  const seen = new Set<string>();
  const sources: AiSource[] = [];
  let i = 0;

  for (const c of citations) {
    const url = c.url?.trim();
    if (!url || !isSafeHttpsUrl(url)) continue;
    const key = url.replace(/\/$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const domain = extractDomain(url);
    if (!domain) continue;
    i += 1;
    sources.push({
      id: `src-${i}`,
      title: c.title?.trim() ? c.title.trim().slice(0, 300) : null,
      url,
      domain,
      supportsClaim: null,
      sourceType: classifySourceType(url),
    });
    if (sources.length >= max) break;
  }

  return sources;
}

export function countWebSearchCalls(response: {
  server_side_tool_usage?: unknown;
  usage?: unknown;
  output?: unknown;
}): number {
  const usage = response.server_side_tool_usage;
  if (usage && typeof usage === "object") {
    const u = usage as Record<string, unknown>;
    if (typeof u.web_search === "number") return u.web_search;
    if (typeof u.web_search_calls === "number") return u.web_search_calls;
  }
  if (Array.isArray(response.output)) {
    return response.output.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { type?: string }).type === "web_search_call",
    ).length;
  }
  return 0;
}
