import Link from "next/link";
import { FEATURES_PAGE } from "../lib/features-page-content";

export function FeaturesUseCases() {
  return (
    <section
      id="cas-usage"
      aria-labelledby="features-use-cases-title"
      className="scroll-mt-28 border-b border-[#e6eef5] py-12 sm:py-14"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="features-use-cases-title"
          className="font-heading text-2xl font-bold tracking-tight text-[#082b46] sm:text-3xl"
        >
          Des scénarios concrets
        </h2>
        <p className="mt-3 max-w-2xl text-base text-[#60758a]">
          Découvrez comment Sebavia peut accompagner différents types de
          voyages, de l’escapade de fin de semaine au long road trip.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES_PAGE.useCases.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-[#d7e0ea] bg-white p-5"
            >
              <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#60758a]">
                {item.body}
              </p>
              {"guideLink" in item && item.guideLink ? (
                <p className="mt-3 text-sm">
                  <Link
                    href={item.guideLink.href}
                    className="font-medium text-[#3b6f9c] underline-offset-2 hover:underline"
                  >
                    {item.guideLink.label} →
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
