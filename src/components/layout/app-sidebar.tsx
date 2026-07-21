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
      header={
        <Link
          href="/dashboard"
          className={cn(
            "focus-visible:ring-sidebar-ring relative block focus-visible:ring-2 focus-visible:outline-none",
            collapsed ? "h-10 w-10" : "h-12 w-full max-w-[10.5rem]",
          )}
          aria-label="Sebavio — Tableau de bord"
        >
          <Image
            src={BRAND_ASSETS.logo}
            alt="Sebavio — L’étoile qui guide votre route"
            fill
            className="object-contain object-left"
            sizes={collapsed ? "40px" : "168px"}
            priority
          />
        </Link>
      }
      footer={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "text-sidebar-foreground hover:bg-sidebar-accent w-full gap-2",
            collapsed ? "justify-center px-0" : "justify-start",
          )}
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
          title={collapsed ? "Étendre" : "Réduire"}
        >
          {collapsed ? <PanelLeft /> : <PanelLeftClose />}
          {!collapsed ? <span>Réduire</span> : null}
        </Button>
      }
    >
      {items.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground before:bg-sebavio-gold font-medium before:absolute before:top-1/2 before:left-0 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full",
              collapsed && "justify-center px-2 before:hidden",
            )}
          >
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-4",
                active
                  ? "text-sebavio-gold"
                  : "text-sebavio-slate dark:text-sebavio-sage",
              )}
              aria-hidden
            >
              <NavIcon name={item.icon} />
            </span>
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
            {collapsed ? <span className="sr-only">{item.label}</span> : null}
          </Link>
        );
      })}
    </Sidebar>
  );
}
