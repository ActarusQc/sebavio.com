import type { BreadcrumbItem } from "@/components/layout/breadcrumbs";
import { ADMIN_NAV_ITEMS } from "@/features/admin/constants";

const ADMIN_HOME: BreadcrumbItem = {
  label: "Administration",
  href: "/admin",
};

/** Fil d’Ariane spécifique au centre d’administration. */
export function buildAdminBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/admin") {
    return [ADMIN_HOME];
  }

  const match = ADMIN_NAV_ITEMS.find(
    (item) =>
      item.href !== "/admin" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  if (!match) {
    return [ADMIN_HOME];
  }

  const crumbs: BreadcrumbItem[] = [
    ADMIN_HOME,
    { label: match.label, href: match.href },
  ];

  if (pathname.startsWith("/admin/users/") && pathname !== "/admin/users") {
    crumbs.push({ label: "Fiche utilisateur" });
  }

  return crumbs;
}
