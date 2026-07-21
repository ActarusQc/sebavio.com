import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

/** Définition explicite + réponses GEO pour moteurs conversationnels. */
export function GeoDefinitionSection() {
  const { geo, definition } = LANDING;

  return (
    <section
      id="a-propos"
      className="border-sebavio-sand/30 scroll-mt-24 border-t bg-white py-16 sm:py-20"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="about-heading"
            className="font-heading text-sebavio-navy text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {geo.title}
          </h2>
          <p className="text-sebavio-navy/90 mt-4 text-base leading-relaxed sm:text-lg">
            {definition}
          </p>
        </FadeIn>

        <dl className="mt-10 space-y-6">
          {geo.questions.map((item, index) => (
            <FadeIn key={item.q} delay={0.03 * index}>
              <div>
                <dt className="font-heading text-sebavio-navy text-base font-semibold">
                  {item.q}
                </dt>
                <dd className="text-sebavio-muted mt-1.5 text-sm leading-relaxed">
                  {item.a}
                </dd>
              </div>
            </FadeIn>
          ))}
        </dl>
      </div>
    </section>
  );
}
