"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import type { UserRole } from "@/lib/constants";
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
      footer={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
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
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              active &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              collapsed && "justify-center px-2",
            )}
          >
            <NavIcon name={item.icon} />
            {!collapsed ? <span>{item.label}</span> : null}
            {collapsed ? <span className="sr-only">{item.label}</span> : null}
          </Link>
        );
      })}
    </Sidebar>
  );
}
