import { formatGuideDate, type GuideMeta } from "../lib/guides-registry";

export function GuideArticleMeta({ guide }: { guide: GuideMeta }) {
  const published = formatGuideDate(guide.publishedAt);
  const updated = formatGuideDate(guide.updatedAt);
  const sameDay =
    guide.publishedAt.slice(0, 10) === guide.updatedAt.slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#60758a]">
      <span className="rounded-full bg-[#e8f1f8] px-3 py-1 font-medium text-[#0b3a5c]">
        {guide.categoryLabel}
      </span>
      <time dateTime={guide.publishedAt}>Publié le {published}</time>
      {!sameDay ? (
        <time dateTime={guide.updatedAt}>Mis à jour le {updated}</time>
      ) : null}
      <span>Lecture ≈ {guide.readingTimeMinutes} min</span>
    </div>
  );
}
