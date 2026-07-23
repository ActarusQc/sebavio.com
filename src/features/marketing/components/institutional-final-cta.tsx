import Link from "next/link";
import { MarketingCtaButton } from "./marketing-cta-button";

export function InstitutionalFinalCta({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="border-t border-[#e6eef5] bg-[#f7fafc] py-12 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl">
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#60758a]">{body}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <MarketingCtaButton href={primary.href}>
            {primary.label}
          </MarketingCtaButton>
          {secondary ? (
            <Link
              href={secondary.href}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] border border-[#c5d4e2] bg-white px-5 text-sm font-semibold text-[#082b46] transition-colors hover:bg-[#eef4f9] focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
