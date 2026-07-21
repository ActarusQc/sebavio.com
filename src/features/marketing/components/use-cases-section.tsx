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
      className="bg-sebavio-background py-16 sm:py-20 lg:py-24"
      aria-labelledby="usecases-heading"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <h2
            id="usecases-heading"
            className="font-heading text-sebavio-navy mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {useCases.title}
          </h2>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {useCases.cases.map((item, index) => {
            const Icon = ICONS[item.id as keyof typeof ICONS] ?? Route;
            return (
              <FadeIn key={item.id} delay={0.04 * index}>
                <article className="border-sebavio-sand/40 flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm">
                  <span className="from-sebavio-gradient-from/15 to-sebavio-gradient-to/20 mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br">
                    <Icon className="text-sebavio-slate size-5" aria-hidden />
                  </span>
                  <h3 className="font-heading text-sebavio-navy text-lg font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-sebavio-muted mt-2 text-sm leading-relaxed">
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
