import Image from "next/image";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";

const REASONS = [
  {
    title: "Tout-en-un",
    description:
      "Itinéraires, véhicules, entretien et budget réunis dans un seul compagnon de voyage.",
    icon: BRAND_ASSETS.icons.boussole.teal,
    tint: "bg-[#e8f2f3] dark:bg-[#e8f2f3]",
  },
  {
    title: "Économisez",
    description:
      "Anticipez le coût du carburant et optimisez vos arrêts pour mieux maîtriser votre budget.",
    icon: BRAND_ASSETS.icons.economisez.teal,
    tint: "bg-[#eaf5f3] dark:bg-[#eaf5f3]",
  },
  {
    title: "Fiable",
    description:
      "Des rappels d’entretien et un suivi clair pour partir en toute confiance.",
    icon: BRAND_ASSETS.icons.fiable.teal,
    tint: "bg-[#f1f3f2] dark:bg-[#f1f3f2]",
  },
  {
    title: "Inspiration",
    description:
      "Des activités et attraits adaptés à votre profil pour enrichir chaque étape.",
    icon: BRAND_ASSETS.icons.coeur.teal,
    tint: "bg-[#f7f3ea] dark:bg-[#f7f3ea]",
  },
] as const;

export function WhySebavio() {
  return (
    <section
      id="pourquoi"
      className="scroll-mt-20 bg-[#faf9f6] py-12 sm:py-16 lg:py-[var(--section-padding-y)] dark:bg-[#faf9f6]"
    >
      <div className="mx-auto grid w-full max-w-[90rem] min-w-0 gap-10 px-0 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8">
        <FadeIn className="min-w-0 px-3 sm:px-6 lg:px-0">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0e2d46] sm:text-3xl md:text-4xl dark:text-[#0e2d46]">
            Pourquoi choisir Sebavio&nbsp;?
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#5f7076] sm:text-base dark:text-[#5f7076]">
            L’étoile qui guide votre route : une plateforme pensée pour les
            voyageurs en camping-car, van et VR qui veulent planifier sans
            stress.
          </p>
          <ul className="mt-8 space-y-5">
            {REASONS.map((reason) => (
              <li key={reason.title} className="flex gap-4">
                <span
                  className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${reason.tint}`}
                >
                  <span className="relative size-7">
                    <Image
                      src={reason.icon}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="28px"
                    />
                  </span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-semibold text-[#0e2d46] dark:text-[#0e2d46]">
                    {reason.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#5f7076] dark:text-[#5f7076]">
                    {reason.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </FadeIn>

        <FadeIn delay={0.08} className="w-full min-w-0">
          <div className="mx-auto w-[calc(100%-24px)] max-w-full sm:w-[calc(100%-48px)] lg:w-full lg:max-w-[min(100%,1200px)]">
            <Image
              src={BRAND_ASSETS.appPreview}
              alt="Aperçu de l’application Sebavio sur ordinateur et mobile"
              width={1536}
              height={1024}
              className="h-auto w-full max-w-full object-contain"
              sizes="(max-width: 640px) calc(100vw - 24px), (max-width: 1024px) calc(100vw - 48px), min(1200px, 50vw)"
              priority={false}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
