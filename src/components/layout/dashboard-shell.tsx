"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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

  return (
    <AppShell
      header={
        <Header
          brand={
            <div className="flex items-center gap-2 md:hidden">
              <MobileNav role={role} />
              <span className="font-heading text-client-night dark:text-foreground text-sm font-semibold tracking-tight">
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
        <Footer className="border-client-border text-client-text-muted bg-transparent" />
      }
    >
      {!isDashboardHome ? (
        <Breadcrumbs items={crumbs} className="mb-4" />
      ) : null}
      {children}
    </AppShell>
  );
}
