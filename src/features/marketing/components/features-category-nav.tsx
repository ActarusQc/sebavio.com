import Link from "next/link";
import { FEATURES_PAGE } from "../lib/features-page-content";

export function FeaturesCategoryNav() {
  return (
    <nav
      aria-label="Familles de fonctionnalités"
      className="border-b border-[#e6eef5] bg-white"
    >
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES_PAGE.categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`#${category.id}`}
                className="group flex h-full flex-col rounded-2xl border border-[#d7e0ea] bg-[#f7fafc] p-4 transition-colors hover:border-[#3b82f6]/40 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
              >
                <span className="font-heading text-base font-semibold text-[#082b46] group-hover:text-[#0b3a5c]">
                  {category.title}
                </span>
                <span className="mt-1 text-sm leading-relaxed text-[#60758a]">
                  {category.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
