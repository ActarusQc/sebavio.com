import Link from "next/link";

type ProductLink = { href: string; label: string };

export function GuideChecklistSection({
  id,
  title,
  lead,
  items,
  tip,
  productLink,
  productLinks,
}: {
  id: string;
  title: string;
  lead: string;
  items: readonly string[];
  tip?: string;
  productLink?: ProductLink | null;
  productLinks?: readonly ProductLink[];
}) {
  const links = [
    ...(productLink ? [productLink] : []),
    ...(productLinks ?? []),
  ];

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="guide-print-section scroll-mt-28 border-b border-[#e6eef5] py-10 sm:py-12"
    >
      <h2
        id={`${id}-title`}
        className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#3d566c]">
        {lead}
      </p>
      <ul className="guide-checklist mt-6 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-base leading-relaxed text-[#1a3348]"
          >
            <span
              className="guide-check-box mt-1 inline-flex h-5 w-5 shrink-0 rounded border border-[#9bb4c9] bg-white"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {tip ? (
        <p className="mt-5 rounded-xl border border-[#d7e0ea] bg-[#f7fafc] px-4 py-3 text-sm leading-relaxed text-[#3d566c]">
          <span className="font-semibold text-[#082b46]">Conseil : </span>
          {tip}
        </p>
      ) : null}
      {links.length > 0 ? (
        <p className="guide-no-print mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
            >
              {link.label} →
            </Link>
          ))}
        </p>
      ) : null}
    </section>
  );
}
