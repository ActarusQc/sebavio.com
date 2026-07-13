import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
};

export type SidebarProps = {
  items?: SidebarItem[];
  /** Contenu libre (prioritaire sur items si fourni). */
  children?: ReactNode;
  collapsed?: boolean;
  className?: string;
  footer?: ReactNode;
};

/**
 * Sidebar repliable — coquille Partie 5 (liens câblés en Partie 6).
 */
export function Sidebar({
  items = [],
  children,
  collapsed = false,
  className,
  footer,
}: SidebarProps) {
  return (
    <aside
      aria-label="Navigation principale"
      data-collapsed={collapsed || undefined}
      className={cn(
        "border-border bg-sidebar text-sidebar-foreground hidden shrink-0 border-r md:flex md:flex-col",
        collapsed ? "w-16" : "w-60",
        className,
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {children
          ? children
          : items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  item.active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                  collapsed && "justify-center px-2",
                )}
              >
                {item.icon}
                {!collapsed ? <span>{item.label}</span> : null}
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : null}
              </a>
            ))}
      </nav>
      {footer ? (
        <div className="border-border border-t p-3">{footer}</div>
      ) : null}
    </aside>
  );
}
