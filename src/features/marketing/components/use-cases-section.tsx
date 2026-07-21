import { Fuel, Route, Users } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";

const ICONS = {
  family: Users,
  long: Fuel,
  detour: Route,
} as const;

/**
 * Preuves d’usage vérifiables — pas de faux témoignages.
 * Prêt à accueillir de vrais avis depuis une source administrable plus tard.
 */
export function UseCasesSection() {
  const { useCases } = LANDING;

  return (
    <section
      className="bg-[#f7f9fc] py-16 lg:py-[5rem]"
      aria-labelledby="usecases-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="usecases-heading"
            className="font-heading mx-auto max-w-3xl text-center text-[1.65rem] font-bold tracking-tight text-[#082b46] sm:text-[2rem]"
          >
            {useCases.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {useCases.cases.map((item, index) => {
            const Icon = ICONS[item.id as keyof typeof ICONS] ?? Route;
            return (
              <FadeIn key={item.id} delay={0.04 * index}>
                <article className="flex h-full flex-col rounded-2xl border border-[#dfe7ef] bg-white p-5 shadow-sm">
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6]/15 to-[#8b5cf6]/20">
                    <Icon className="size-5 text-[#3b82f6]" aria-hidden />
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-[#082b46]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-[#60758a]">
                    {item.body}
                  </p>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
