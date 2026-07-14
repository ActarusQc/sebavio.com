"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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
  unreadNotificationCount?: number;
  children: ReactNode;
};

export function DashboardShell({
  email,
  role,
  unreadNotificationCount = 0,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <AppShell
      header={
        <Header
          brand={
            <div className="flex items-center gap-2">
              <MobileNav role={role} />
              <Link
                href="/dashboard"
                className="focus-visible:ring-ring rounded-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
              >
                Sebavio
              </Link>
            </div>
          }
          search={<HeaderSearch />}
          actions={
            <>
              <NotificationBell unreadCount={unreadNotificationCount} />
              <ThemeToggle />
              <UserMenu email={email} role={role} />
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
      footer={<Footer />}
    >
      <Breadcrumbs items={crumbs} />
      {children}
    </AppShell>
  );
}
