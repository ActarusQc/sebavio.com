export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs", exact: false },
  { href: "/admin/audit", label: "Journal d'audit", exact: false },
  { href: "/admin/campings", label: "Campings", exact: false },
  { href: "/admin/activites", label: "Activités", exact: false },
  { href: "/dashboard/catalog", label: "Catalogue", exact: false },
] as const;

export const ADMIN_USER_LIST_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_USER_LIST_MAX_PAGE_SIZE = 100;
export const ADMIN_AUDIT_DEFAULT_PAGE_SIZE = 30;
export const ADMIN_AUDIT_MAX_PAGE_SIZE = 100;

export const ROLE_LABELS: Record<string, string> = {
  user: "Utilisateur",
  admin: "Admin",
  super_admin: "Super admin",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  deleted: "Supprimé",
};
