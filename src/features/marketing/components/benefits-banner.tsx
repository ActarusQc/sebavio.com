import Image from "next/image";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";

/** Même bleu marine que la fin du dégradé Hero. */
const HERO_NAVY = "#0E2D46";

const BENEFITS = [
  {
    title: "Itinéraires intelligents",
    description:
      "Des parcours adaptés à votre véhicule, vos préférences et votre rythme.",
    icon: BRAND_ASSETS.icons.itineraires.blanc,
  },
  {
    title: "Coût du carburant en temps réel",
    description: "Estimez vos dépenses avec des prix à jour avant de partir.",
    icon: BRAND_ASSETS.icons.carburant.blanc,
  },
  {
    title: "Suivi de véhicule et entretien",
    description: "Rappels et historique pour voyager l’esprit tranquille.",
    icon: BRAND_ASSETS.icons.entretien.blanc,
  },
  {
    title: "Activités selon votre profil",
    description: "Découvrez des attraits adaptés à votre style de voyage.",
    icon: BRAND_ASSETS.icons.activites.blanc,
  },
  {
    title: "Parfait pour toute la famille",
    description: "Des voyages mémorables, pensés pour petits et grands.",
    icon: BRAND_ASSETS.icons.famille.blanc,
  },
] as const;

export function BenefitsBanner() {
  return (
    <section
      className="text-sebavio-background relative z-10 -mt-14 w-full min-w-0 sm:-mt-20 md:-mt-24"
      style={{ backgroundColor: HERO_NAVY }}
    >
      {/* Espace adapté à la hauteur réelle du formulaire (empilé sur mobile) */}
      <div className="mx-auto max-w-[90rem] px-4 pt-44 pb-12 sm:px-6 sm:pt-40 sm:pb-16 md:pt-36 lg:px-8 lg:pt-40 lg:pb-20">
        <FadeIn>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
            {BENEFITS.map((benefit, index) => (
              <li
                key={benefit.title}
                className="relative flex flex-col items-center px-3 text-center lg:px-4"
              >
                {index > 0 ? (
                  <span
                    className="absolute top-1 bottom-1 left-0 hidden w-px bg-white/10 lg:block"
                    aria-hidden
                  />
                ) : null}
                <span className="relative mb-3 size-11">
                  <Image
                    src={benefit.icon}
                    alt=""
                    fill
                    className="object-contain [filter:brightness(0)_saturate(100%)_invert(77%)_sepia(48%)_saturate(650%)_hue-rotate(358deg)_brightness(101%)_contrast(92%)]"
                    sizes="44px"
                  />
                </span>
                <h2 className="font-heading text-sm font-semibold tracking-tight sm:text-[0.95rem]">
                  {benefit.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-white/70 sm:text-sm">
                  {benefit.description}
                </p>
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>

      <div
        className="relative -mb-px overflow-hidden leading-[0] text-[#faf9f6]"
        aria-hidden
      >
        <svg
          viewBox="0 0 1440 96"
          preserveAspectRatio="none"
          className="block h-14 w-full sm:h-20 lg:h-24"
        >
          <path
            fill="currentColor"
            d="M0,48 C240,96 480,0 720,32 C960,64 1200,96 1440,40 L1440,96 L0,96 Z"
          />
        </svg>
      </div>
    </section>
  );
}
