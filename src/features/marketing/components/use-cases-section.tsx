import Image from "next/image";
import { FadeIn } from "@/components/common";
import { LANDING } from "../lib/landing-content";
import { MARKETING_ASSETS } from "../lib/marketing-assets";

const USECASE_VISUALS = {
  family: {
    ...MARKETING_ASSETS.usecaseFamily,
    result: "Résultat : un trajet rythmé et adapté",
  },
  long: {
    ...MARKETING_ASSETS.usecaseFuel,
    result: "Résultat : arrêts calculés selon le véhicule",
  },
  detour: {
    ...MARKETING_ASSETS.usecaseDetour,
    result: "Résultat : itinéraire recalculé instantanément",
  },
} as const;

/**
 * Preuves d’usage — disposition proche des cartes témoignages de la maquette,
 * sans faux avis. Prêt à accueillir de vrais témoignages plus tard.
 */
export function UseCasesSection() {
  const { useCases } = LANDING;

  return (
    <section
      id="preuves"
      className="bg-[#f7f9fc] py-[3.5rem] sm:py-16 lg:py-[4.5rem]"
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

          <div className="grid gap-5 md:grid-cols-3 md:items-stretch">
            {useCases.cases.map((item, index) => {
              const visual =
                USECASE_VISUALS[item.id as keyof typeof USECASE_VISUALS];

              return (
                <FadeIn key={item.id} delay={0.04 * index}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfe7ef] bg-white shadow-[0_12px_32px_rgba(8,43,70,0.07)]">
                    <figure className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#eef3f8]">
                      <Image
                        src={visual.src}
                        alt={visual.alt}
                        fill
                        sizes="(max-width: 768px) 92vw, (max-width: 1280px) 30vw, 360px"
                        className="object-cover object-center"
                      />
                    </figure>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="font-heading text-[1.2rem] font-semibold text-[#082b46]">
                        {item.title}
                      </h3>
                      <p className="mt-2.5 flex-1 text-[1rem] leading-relaxed text-[#60758a]">
                        {item.body}
                      </p>
                      <p className="mt-4 text-[0.85rem] font-medium text-[#3b82f6]">
                        {visual.result}
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
