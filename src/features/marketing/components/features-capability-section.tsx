import Link from "next/link";
import type { ReactNode } from "react";

export function FeaturesCapabilitySection({
  id,
  title,
  lead,
  items,
  note,
  children,
  aside,
}: {
  id: string;
  title: string;
  lead: string;
  items?: readonly string[];
  note?: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-b border-[#e6eef5] py-12 sm:py-14"
    >
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <h2
            id={`${id}-title`}
            className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#405466]">
            {lead}
          </p>
          {items && items.length > 0 ? (
            <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#405466]">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {children}
          {note ? (
            <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#60758a]">
              {note}
            </p>
          ) : null}
        </div>
        {aside ? <aside className="lg:pt-2">{aside}</aside> : null}
      </div>
    </section>
  );
}

export function FeaturesExampleList({
  examples,
}: {
  examples: readonly string[];
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold tracking-wide text-[#082b46] uppercase">
        Exemples de demandes
      </h3>
      <ul className="mt-3 space-y-2">
        {examples.map((example) => (
          <li
            key={example}
            className="rounded-xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm text-[#405466]"
          >
            <span className="text-[#60758a]">« </span>
            {example}
            <span className="text-[#60758a]"> »</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeaturesInlineLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <p className="mt-4 text-sm">
      <Link href={href} className="font-medium text-[#3b6f9c] hover:underline">
        {label}
      </Link>
    </p>
  );
}
