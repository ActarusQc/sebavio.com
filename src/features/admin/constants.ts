import type { AdminPermission } from "@/lib/rbac";

export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** Permission requise pour afficher l'entrée (en plus de admin.portal). */
  permission: AdminPermission;
  /** Phase d'implantation — stub si non encore livrée. */
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** true = page réelle disponible. */
  available: boolean;
};

/**
 * Navigation admin — chemins EN (cahier des charges).
 * Filtrage runtime via `hasPermission`.
 */
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    href: "/admin",
    label: "Tableau de bord",
    exact: true,
    permission: "admin.dashboard",
    phase: 1,
    available: true,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    permission: "users.read",
    phase: 1,
    available: true,
  },
  {
    href: "/admin/subscriptions",
    label: "Abonnements",
    permission: "billing.read",
    phase: 3,
    available: false,
  },
  {
    href: "/admin/payments",
    label: "Paiements",
    permission: "billing.read",
    phase: 3,
    available: false,
  },
  {
    href: "/admin/plans",
    label: "Forfaits",
    permission: "plans.read",
    phase: 4,
    available: false,
  },
  {
    href: "/admin/analytics",
    label: "Statistiques",
    permission: "analytics.read",
    phase: 6,
    available: false,
  },
  {
    href: "/admin/ai",
    label: "Intelligence artificielle",
    permission: "ai.read",
    phase: 5,
    available: false,
  },
  {
    href: "/admin/audit",
    label: "Journal d'audit",
    permission: "audit.read",
    phase: 1,
    available: true,
  },
  {
    href: "/admin/settings",
    label: "Paramètres",
    permission: "settings.read",
    phase: 7,
    available: false,
  },
  {
    href: "/admin/campings",
    label: "Campings",
    permission: "content.manage",
    phase: 1,
    available: true,
  },
  {
    href: "/admin/activites",
    label: "Activités",
    permission: "content.manage",
    phase: 1,
    available: true,
  },
  {
    href: "/admin/catalogue-carburant",
    label: "Catalogue NRCan",
    permission: "content.manage",
    phase: 1,
    available: true,
  },
] as const;

export const ADMIN_USER_LIST_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_USER_LIST_MAX_PAGE_SIZE = 100;
export const ADMIN_AUDIT_DEFAULT_PAGE_SIZE = 30;
export const ADMIN_AUDIT_MAX_PAGE_SIZE = 100;

export const ROLE_LABELS: Record<string, string> = {
  user: "Utilisateur",
  support: "Support",
  analyst: "Analyste",
  billing_admin: "Admin facturation",
  admin: "Admin",
  super_admin: "Super admin",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  deleted: "Supprimé",
};

export const ENV_LABELS = {
  development: "Développement",
  test: "Test",
  production: "Production",
} as const;
