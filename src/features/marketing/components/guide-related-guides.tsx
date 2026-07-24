import Link from "next/link";
import {
  formatGuideDate,
  getRelatedGuides,
  type GuideMeta,
} from "../lib/guides-registry";

export function GuideRelatedGuides({ guide }: { guide: GuideMeta }) {
  const related = getRelatedGuides(guide);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="related-guides-title"
      className="guide-no-print scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
    >
      <h2
        id="related-guides-title"
        className="font-heading text-2xl font-bold text-[#082b46] sm:text-3xl"
      >
        À lire aussi
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {related.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/guides/${item.slug}`}
              className="block h-full rounded-xl border border-[#d7e0ea] bg-[#f7fafc] p-5 transition hover:border-[#9bb4c9] focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
            >
              <p className="text-xs font-semibold tracking-wide text-[#3b6f9c] uppercase">
                {item.categoryLabel}
              </p>
              <p className="font-heading mt-2 text-lg font-semibold text-[#082b46]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#3d566c]">
                {item.excerpt}
              </p>
              <p className="mt-3 text-xs text-[#60758a]">
                <time dateTime={item.publishedAt}>
                  {formatGuideDate(item.publishedAt)}
                </time>
                <span aria-hidden> · </span>
                Lecture ≈ {item.readingTimeMinutes} min
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
