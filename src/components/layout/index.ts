/**
 * Composants de layout (Header, Sidebar, etc.).
 * Socle architectural — aucune logique métier.
 */
export { AppShell, type AppShellProps } from "./app-shell";
export { Header, type HeaderProps } from "./header";
export { Sidebar, type SidebarProps, type SidebarItem } from "./sidebar";
export { Footer, type FooterProps } from "./footer";
export {
  Breadcrumbs,
  type BreadcrumbsProps,
  type BreadcrumbItem,
} from "./breadcrumbs";
export {
  MAIN_NAV_ITEMS,
  getVisibleNavItems,
  isNavItemActive,
  buildBreadcrumbs,
  type NavItemConfig,
  type NavIconName,
} from "./navigation";
export { DashboardShell, type DashboardShellProps } from "./dashboard-shell";
export {
  ModulePlaceholder,
  type ModulePlaceholderProps,
} from "./module-placeholder";
export { HeaderSearch } from "./header-search";
export { UserMenu, type UserMenuProps } from "./user-menu";
export { MobileNav, type MobileNavProps } from "./mobile-nav";
export { AppSidebar, type AppSidebarProps } from "./app-sidebar";
