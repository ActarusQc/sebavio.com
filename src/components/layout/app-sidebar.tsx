"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { BRAND_ASSETS } from "@/features/marketing";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { getVisibleNavItems, isNavItemActive } from "./navigation";
import { NavIcon } from "./nav-icons";

export type AppSidebarProps = {
  role: UserRole;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function AppSidebar({
  role,
  collapsed,
  onToggleCollapsed,
}: AppSidebarProps) {
  const pathname = usePathname();
  const items = getVisibleNavItems(role);

  return (
    <Sidebar
      collapsed={collapsed}
      className="border-client-border bg-[var(--client-sidebar)]"
      header={
        <Link
          href="/dashboard"
          className={cn(
            "focus-visible:ring-sidebar-ring relative flex flex-col gap-1.5 focus-visible:ring-2 focus-visible:outline-none",
            collapsed ? "items-center" : "items-start",
          )}
          aria-label="Sebavio — Tableau de bord"
        >
          <span
            className={cn(
              "relative block",
              collapsed ? "h-11 w-11" : "h-12 w-full max-w-[13rem]",
            )}
          >
            <Image
              src={BRAND_ASSETS.logo}
              alt="Sebavio — L’étoile qui guide votre route"
              fill
              className="object-contain object-left"
              sizes={collapsed ? "44px" : "208px"}
              priority
            />
          </span>
          {!collapsed ? (
            <span className="text-client-text-muted text-[0.6875rem] font-medium tracking-[0.06em] uppercase">
              Seba = étoile · Via = route
            </span>
          ) : null}
        </Link>
      }
      footer={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "text-client-text-muted hover:bg-client-pale hover:text-client-text h-11 w-full gap-2",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
          title={collapsed ? "Étendre" : "Réduire"}
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
          {!collapsed ? <span className="text-sm">Réduire</span> : null}
        </Button>
      }
    >
      {items.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        const showBadge = item.href === "/dashboard/ai";
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "focus-visible:ring-sidebar-ring relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.9375rem] transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
              "text-client-text hover:bg-client-pale",
              active &&
                "bg-client-sidebar-active hover:bg-client-sidebar-active before:bg-sebavio-gold font-semibold text-white before:absolute before:top-1/2 before:left-0 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full hover:text-white",
              collapsed && "justify-center px-2 before:hidden",
            )}
          >
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-[1.125rem]",
                active ? "text-sebavio-gold" : "text-sebavio-slate",
              )}
              aria-hidden
            >
              <NavIcon name={item.icon} />
            </span>
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate">{item.label}</span>
                {showBadge ? (
                  <span className="border-sebavio-gold/40 bg-sebavio-orange-100 text-sebavio-navy shrink-0 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold">
                    Nouveau
                  </span>
                ) : null}
              </span>
            ) : null}
            {collapsed ? <span className="sr-only">{item.label}</span> : null}
          </Link>
        );
      })}
    </Sidebar>
  );
}
