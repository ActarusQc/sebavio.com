"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/constants";
import { ThemeToggle } from "@/components/common";
import { NotificationBell } from "@/features/notifications/components";
import { HeaderSearch } from "@/components/layout/header-search";
import { UserMenu } from "@/components/layout/user-menu";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AdminSidebar } from "./admin-sidebar";
import { ROLE_LABELS } from "@/features/admin/constants";
import { buildAdminBreadcrumbs } from "@/features/admin/lib/breadcrumbs";

export type AdminShellProps = {
  email: string;
  role: UserRole;
  envLabel: string;
  envKind: "development" | "test" | "production";
  unreadNotificationCount?: number;
  children: ReactNode;
};

export function AdminShell({
  email,
  role,
  envLabel,
  envKind,
  unreadNotificationCount = 0,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const breadcrumbs = buildAdminBreadcrumbs(pathname);

  return (
    <div className="bg-background flex min-h-screen">
      <div className="sticky top-0 hidden h-screen shrink-0 md:block">
        <AdminSidebar
          role={role}
          email={email}
          envLabel={envLabel}
          envKind={envKind}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card/80 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-2.5 backdrop-blur-sm">
          <div className="md:hidden">
            <AdminSidebar
              role={role}
              email={email}
              envLabel={envLabel}
              envKind={envKind}
              collapsed
            />
          </div>
          <div className="min-w-0 flex-1">
            <HeaderSearch />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="bg-muted text-muted-foreground hidden rounded-md px-2 py-1 text-[11px] font-medium sm:inline"
              title="Rôle administrateur"
            >
              {ROLE_LABELS[role] ?? role}
            </span>
            <NotificationBell unreadCount={unreadNotificationCount} />
            <ThemeToggle />
            <UserMenu email={email} role={ROLE_LABELS[role] ?? role} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Breadcrumbs items={breadcrumbs} className="mb-4" />
          {children}
        </main>
      </div>
    </div>
  );
}
