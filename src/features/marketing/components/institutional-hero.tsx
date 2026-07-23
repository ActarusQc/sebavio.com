import { InstitutionalBreadcrumb } from "./institutional-breadcrumb";
import { MarketingCtaButton } from "./marketing-cta-button";

type Cta = { href: string; label: string };

export function InstitutionalHero({
  eyebrow,
  title,
  body,
  breadcrumbs,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string;
  title: string;
  body: string;
  breadcrumbs: Array<{ href?: string; label: string }>;
  primaryCta?: Cta;
  secondaryCta?: Cta;
}) {
  return (
    <section className="relative overflow-hidden bg-[#050b1c] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.22),_transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <InstitutionalBreadcrumb
          items={breadcrumbs}
          className="[&_[aria-current=page]]:text-white [&_a]:text-sky-300 [&_span]:text-white/70"
        />
        <p className="mt-5 text-sm font-medium tracking-wide text-sky-300 uppercase">
          {eyebrow}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {body}
        </p>
        {(primaryCta || secondaryCta) && (
          <div className="mt-7 flex flex-wrap gap-3">
            {primaryCta ? (
              <MarketingCtaButton href={primaryCta.href}>
                {primaryCta.label}
              </MarketingCtaButton>
            ) : null}
            {secondaryCta ? (
              <MarketingCtaButton href={secondaryCta.href} variant="secondary">
                {secondaryCta.label}
              </MarketingCtaButton>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
