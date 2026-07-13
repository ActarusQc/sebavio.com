import type { UserRole } from "@/lib/constants";
import { isAdminRole } from "@/features/auth/services/roles";
import type { BreadcrumbItem } from "./breadcrumbs";

/**
 * Navigation principale (Document 3 / 7 / 8 — Partie 6).
 *
 * Modules Document 3 SANS entrée de menu dédiée :
 * météo (`weather`), carburant (`fuel`), campings (`campings`),
 * activités (`activities`) et cartes (`maps`) seront des sections
 * internes du module Voyages (`trips`), conformément à la vision produit.
 * Ne pas ajouter de routes top-level pour ces domaines ici.
 */

export type NavItemConfig = {
  href: string;
  label: string;
  /** Clé Lucide (résolue côté UI). */
  icon: NavIconName;
  /** Feature associée (documentation / traçabilité). */
  feature: string;
  /** Si true, visible uniquement pour admin / super_admin. */
  adminOnly?: boolean;
};

export type NavIconName =
  | "layout-dashboard"
  | "map"
  | "car"
  | "book-open"
  | "wrench"
  | "wallet"
  | "sparkles"
  | "bell"
  | "credit-card"
  | "settings"
  | "shield";

export const MAIN_NAV_ITEMS: readonly NavItemConfig[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: "layout-dashboard",
    feature: "dashboard",
  },
  {
    href: "/dashboard/trips",
    label: "Voyages",
    icon: "map",
    feature: "trips",
  },
  {
    href: "/dashboard/vehicles",
    label: "Véhicules",
    icon: "car",
    feature: "vehicles",
  },
  {
    href: "/dashboard/catalog",
    label: "Catalogue véhicules",
    icon: "book-open",
    feature: "vehicle-catalog",
  },
  {
    href: "/dashboard/maintenance",
    label: "Entretien",
    icon: "wrench",
    feature: "maintenance",
  },
  {
    href: "/dashboard/finance",
    label: "Finances",
    icon: "wallet",
    feature: "finance",
  },
  {
    href: "/dashboard/ai",
    label: "Assistant IA",
    icon: "sparkles",
    feature: "ai",
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: "bell",
    feature: "notifications",
  },
  {
    href: "/dashboard/subscription",
    label: "Abonnement",
    icon: "credit-card",
    feature: "subscriptions",
  },
  {
    href: "/dashboard/settings",
    label: "Paramètres",
    icon: "settings",
    feature: "users",
  },
  {
    href: "/admin",
    label: "Administration",
    icon: "shield",
    feature: "admin",
    adminOnly: true,
  },
] as const;

/** Filtre les entrées selon le rôle (session Auth.js). */
export function getVisibleNavItems(role: UserRole): NavItemConfig[] {
  return MAIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdminRole(role));
}

/** Indique si un item est actif pour le pathname courant. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const BREADCRUMB_HOME: BreadcrumbItem = {
  label: "Tableau de bord",
  href: "/dashboard",
};

/** Construit le fil d’Ariane à partir du pathname. */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const match = MAIN_NAV_ITEMS.find(
    (item) =>
      item.href === pathname ||
      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
  );

  if (!match) {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard")) {
      return [{ label: BREADCRUMB_HOME.label }];
    }
    return [{ label: BREADCRUMB_HOME.label, href: BREADCRUMB_HOME.href }];
  }

  if (match.href === "/dashboard") {
    return [{ label: match.label }];
  }

  return [
    { label: BREADCRUMB_HOME.label, href: BREADCRUMB_HOME.href },
    { label: match.label },
  ];
}
