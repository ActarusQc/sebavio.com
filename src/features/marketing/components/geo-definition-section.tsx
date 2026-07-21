import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

/** Définition explicite + réponses GEO pour moteurs conversationnels. */
export function GeoDefinitionSection() {
  const { geo, definition } = LANDING;

  return (
    <section
      id="a-propos"
      className="scroll-mt-24 border-t border-[#dfe7ef] bg-white py-14 sm:py-16"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="about-heading"
            className="font-heading text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2rem]"
          >
            {geo.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#082b46]/90 sm:text-lg">
            {definition}
          </p>
        </FadeIn>

        <dl className="mt-8 space-y-5">
          {geo.questions.map((item, index) => (
            <FadeIn key={item.q} delay={0.03 * index}>
              <div>
                <dt className="font-heading text-base font-semibold text-[#082b46]">
                  {item.q}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-[#60758a]">
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
