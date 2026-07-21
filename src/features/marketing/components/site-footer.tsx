import Image from "next/image";
import Link from "next/link";
import { BRAND_ASSETS } from "../lib/brand-assets";

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/pricing", label: "Tarifs" },
      { href: "/register", label: "Créer un compte" },
      { href: "/login", label: "Se connecter" },
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
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-sebavio-navy text-sebavio-background">
      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="focus-visible:ring-sebavio-gold relative mb-4 block h-24 w-24 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Image
                src={BRAND_ASSETS.logoBlanc}
                alt="Sebavio — L’étoile qui guide votre route"
                fill
                className="object-contain object-left"
                sizes="96px"
              />
            </Link>
            <p className="text-sebavio-sand max-w-sm text-sm leading-relaxed">
              Compagnon intelligent pour planifier vos voyages en camping-car,
              van et VR — plus simplement, plus sereinement.
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
                      className="text-sebavio-sand hover:text-sebavio-gold text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-sebavio-slate/40 mt-10 border-t pt-6 text-center">
          <p className="text-sebavio-sand/80 text-xs">
            © {year} Sebavio. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
