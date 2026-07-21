import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/common";
import { BRAND_ASSETS } from "../lib/brand-assets";

const FEATURES = [
  {
    title: "Planification avancée",
    description:
      "Créez et organisez vos voyages avec départ, destination, dates et budget.",
    icon: BRAND_ASSETS.icons.planification.teal,
    href: "/register",
  },
  {
    title: "Prix du carburant",
    description:
      "Estimez le coût de la route grâce aux données carburant intégrées.",
    icon: BRAND_ASSETS.icons.carburant.teal,
    href: "/login?callbackUrl=/dashboard/finance",
  },
  {
    title: "Entretien et rappels",
    description:
      "Suivez l’entretien de votre véhicule et recevez des rappels utiles.",
    icon: BRAND_ASSETS.icons.entretien.teal,
    href: "/login?callbackUrl=/dashboard/maintenance",
  },
  {
    title: "Véhicules et camping-cars",
    description:
      "Gérez vos véhicules, consommations et informations essentielles.",
    icon: BRAND_ASSETS.icons.campingcar.teal,
    href: "/login?callbackUrl=/dashboard/vehicles",
  },
  {
    title: "Activités et attraits",
    description:
      "Enrichissez vos étapes avec des activités adaptées à votre profil.",
    icon: BRAND_ASSETS.icons.activites.teal,
    href: "/login?callbackUrl=/dashboard/trips",
  },
  {
    title: "Voyages et favoris",
    description:
      "Retrouvez vos voyages, groupes de voyage et préférences en un clin d’œil.",
    icon: BRAND_ASSETS.icons.coeur.teal,
    href: "/login?callbackUrl=/dashboard/trips",
  },
] as const;

/**
 * Grille marketing — identité claire forcée (ignore le thème sombre système).
 */
export function FeaturesGrid() {
  return (
    <section
      id="fonctionnalites"
      className="scroll-mt-20 bg-[#faf9f6] py-12 sm:py-16 lg:py-[var(--section-padding-y)] dark:bg-[#faf9f6]"
    >
      <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#0e2d46] sm:text-3xl md:text-4xl dark:text-[#0e2d46]">
            Fonctionnalités principales
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5f7076] sm:text-base dark:text-[#5f7076]">
            Des outils concrets pour préparer, vivre et profiter de chaque
            voyage.
          </p>
        </FadeIn>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 0.03}>
              <li className="group flex h-full flex-col rounded-[1.125rem] border border-[rgba(78,127,133,0.16)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 dark:border-[rgba(78,127,133,0.16)] dark:bg-white">
                <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[rgba(111,168,161,0.15)] sm:mb-4 sm:size-14 dark:bg-[rgba(111,168,161,0.15)]">
                  <span className="relative size-7 sm:size-8">
                    <Image
                      src={feature.icon}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="32px"
                    />
                  </span>
                </span>
                <h3 className="font-heading text-center text-base font-semibold text-[#0e2d46] sm:text-lg dark:text-[#0e2d46]">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-center text-sm leading-relaxed text-[#5f7076] dark:text-[#5f7076]">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="mt-4 inline-flex items-center justify-center gap-1 text-sm font-medium text-[#4e7f85] transition-colors hover:text-[#0e2d46] sm:mt-5 dark:text-[#4e7f85] dark:hover:text-[#0e2d46]"
                >
                  En savoir plus
                  <ChevronRight className="size-4 text-[#f0b64d] transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  );
}
