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
      { href: "/pricing", label: "Tarifs" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/#comment-ca-fonctionne", label: "Comment ça fonctionne" },
      { href: "/#a-propos", label: "À propos" },
      { href: "/register", label: "Créer un compte" },
    ],
  },
  {
    title: "Espace membre",
    links: [
      { href: "/login", label: "Connexion" },
      { href: "/login?callbackUrl=/dashboard/trips", label: "Voyages" },
      { href: "/login?callbackUrl=/dashboard/vehicles", label: "Véhicules" },
      {
        href: "/login?callbackUrl=/dashboard/maintenance",
        label: "Entretien",
      },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/forgot-password", label: "Mot de passe oublié" },
      {
        href: "/login?callbackUrl=/dashboard/settings",
        label: "Paramètres",
      },
      { href: "/pricing", label: "Forfaits" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#050b1c] text-white">
      <div className="mx-auto max-w-[96rem] px-[clamp(1.5rem,4vw,4.5rem)] py-12 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
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
              {LANDING.definition}
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
                      className="text-sm text-white/60 transition-colors hover:text-white"
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
