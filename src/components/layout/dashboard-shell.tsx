"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { UserRole } from "@/lib/constants";
import { ThemeToggle } from "@/components/common";
import { NotificationBell } from "@/features/notifications/components";
import { AppShell } from "./app-shell";
import { Header } from "./header";
import { Footer } from "./footer";
import { Breadcrumbs } from "./breadcrumbs";
import { HeaderSearch } from "./header-search";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { AppSidebar } from "./app-sidebar";
import { buildBreadcrumbs } from "./navigation";
import { CLIENT_THEME_KEY } from "./client-theme";

export type DashboardShellProps = {
  email: string;
  role: UserRole;
  displayName?: string | null;
  unreadNotificationCount?: number;
  children: ReactNode;
};

export function DashboardShell({
  email,
  role,
  displayName = null,
  unreadNotificationCount = 0,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isDashboardHome = pathname === "/dashboard";
  const crumbs = buildBreadcrumbs(pathname);
  const { setTheme } = useTheme();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CLIENT_THEME_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else {
        setTheme("dark");
        window.localStorage.setItem(CLIENT_THEME_KEY, "dark");
      }
    } catch {
      setTheme("dark");
    }
  }, [setTheme]);

  return (
    <AppShell
      header={
        <Header
          brand={
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav role={role} />
              <span className="font-heading text-sm font-semibold tracking-tight text-white">
                Sebavio
              </span>
            </div>
          }
          search={<HeaderSearch />}
          actions={
            <>
              <NotificationBell unreadCount={unreadNotificationCount} />
              <ThemeToggle />
              <UserMenu email={email} role={role} displayName={displayName} />
            </>
          }
        />
      }
      sidebar={
        <AppSidebar
          role={role}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
        />
      }
      footer={
        <Footer className="border-white/10 bg-transparent text-white/45" />
      }
    >
      {!isDashboardHome ? (
        <Breadcrumbs items={crumbs} className="mb-4 text-white/60" />
      ) : null}
      {children}
    </AppShell>
  );
}
