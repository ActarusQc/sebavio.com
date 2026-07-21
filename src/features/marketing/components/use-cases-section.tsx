import { Fuel, Route, Users } from "lucide-react";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import {
  MarketingFuelPlanMini,
  MarketingRouteAdaptMini,
} from "./marketing-feature-minis";

const ICONS = {
  family: Users,
  long: Fuel,
  detour: Route,
} as const;

/**
 * Preuves d’usage — même disposition visuelle que les témoignages de la maquette,
 * sans faux avis. Prêt à accueillir de vrais témoignages plus tard.
 */
export function UseCasesSection() {
  const { useCases } = LANDING;

  return (
    <section
      id="preuves"
      className="bg-[#f7f9fc] py-[3.5rem] sm:py-16 lg:py-[4.25rem]"
      aria-labelledby="usecases-heading"
    >
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)]">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(16rem,0.85fr)_minmax(0,2.2fr)] lg:gap-10">
          <FadeIn>
            <h2
              id="usecases-heading"
              className="font-heading text-[1.75rem] font-bold tracking-tight text-[#082b46] sm:text-[2.15rem]"
            >
              {useCases.title}
            </h2>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-[#60758a]">
              Des situations concrètes que Sebavio gère déjà — sans inventer
              d’avis ni de notes.
            </p>
            <p className="mt-6 text-[0.9rem] text-[#60758a]">
              Les témoignages vérifiés pourront s’afficher ici dès qu’ils seront
              disponibles.
            </p>
          </FadeIn>

          <div className="grid gap-5 md:grid-cols-3">
            {useCases.cases.map((item, index) => {
              const Icon = ICONS[item.id as keyof typeof ICONS] ?? Route;
              return (
                <FadeIn key={item.id} delay={0.04 * index}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_10px_30px_rgba(8,43,70,0.06)]">
                    <div className="min-h-[9.5rem] border-b border-[#eef2f7] bg-[#fafbfc] p-3">
                      {item.id === "family" ? (
                        <div className="space-y-2">
                          <div className="rounded-xl bg-[#0c1e38] px-2.5 py-2 text-[0.68rem] text-white">
                            Pauses famille + activités enfants
                          </div>
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="h-12 flex-1 rounded-md bg-gradient-to-br from-[#94a3b8] to-[#475569]"
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {item.id === "long" ? (
                        <div className="max-h-[9rem] overflow-hidden">
                          <MarketingFuelPlanMini />
                        </div>
                      ) : null}
                      {item.id === "detour" ? (
                        <div className="max-h-[9rem] overflow-hidden">
                          <MarketingRouteAdaptMini />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <h3 className="font-heading text-[1.15rem] font-semibold text-[#082b46]">
                        {item.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-[#60758a]">
                        {item.body}
                      </p>
                      <p className="mt-4 text-[0.8rem] font-medium text-[#3b82f6]">
                        {item.id === "family"
                          ? "Résultat : un trajet rythmé et adapté"
                          : item.id === "long"
                            ? "Résultat : arrêts calculés selon le véhicule"
                            : "Résultat : itinéraire recalculé instantanément"}
                      </p>
                    </div>
                  </article>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
