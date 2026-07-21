import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { LANDING } from "../lib/landing-content";

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#demo-agent", label: "Agent conversationnel" },
      { href: "/#fonctionnalites", label: "Plan de carburant" },
      {
        href: "/login?callbackUrl=/dashboard/vehicles",
        label: "Gestion du véhicule",
      },
      { href: "/#fonctionnalites", label: "Météo et activités" },
      { href: "/pricing", label: "Tarifs" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/#a-propos", label: "À propos" },
      { href: "/#comment-ca-fonctionne", label: "Comment ça fonctionne" },
      { href: "/register", label: "Créer un compte" },
      { href: "/login", label: "Connexion" },
    ],
  },
  {
    title: "Espace membre",
    links: [
      { href: "/login?callbackUrl=/dashboard/trips", label: "Voyages" },
      { href: "/login?callbackUrl=/dashboard/vehicles", label: "Véhicules" },
      {
        href: "/login?callbackUrl=/dashboard/maintenance",
        label: "Entretien",
      },
      {
        href: "/login?callbackUrl=/dashboard/settings",
        label: "Paramètres",
      },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sebavio-night text-white">
      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="focus-visible:ring-sebavio-gold relative mb-4 flex items-center gap-3 focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="relative size-14 overflow-hidden rounded-full">
                <Image
                  src={BRAND_ASSETS.logoBlanc}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="56px"
                  aria-hidden
                />
              </span>
              <span className="flex flex-col">
                <span className="font-heading text-lg font-bold tracking-wide">
                  Sebavio
                </span>
                <span className="text-xs text-white/55">
                  {LANDING.brandTagline}
                </span>
              </span>
              <span className="sr-only">
                Sebavio — L’étoile qui guide votre route
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              {LANDING.footer.description}
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="hover:text-sebavio-gold text-sm text-white/60 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-white/50">
            © {year} Sebavio. Tous droits réservés.
          </p>
          <p className="text-xs text-white/50">{LANDING.footer.crafted}</p>
        </div>
      </div>
    </footer>
  );
}
