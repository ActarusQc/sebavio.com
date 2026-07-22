import type { ReactNode } from "react";
import Link from "next/link";
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
  header?: ReactNode;
  footer?: ReactNode;
};

/**
 * Sidebar repliable — coquille espace client Sebavio.
 */
export function Sidebar({
  items = [],
  children,
  collapsed = false,
  className,
  header,
  footer,
}: SidebarProps) {
  return (
    <aside
      aria-label="Navigation principale"
      data-collapsed={collapsed || undefined}
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground hidden shrink-0 border-r md:flex md:flex-col",
        "transition-[width] duration-200 ease-out motion-reduce:transition-none",
        collapsed ? "w-[4.75rem]" : "w-[16.5rem]",
        className,
      )}
    >
      {header ? (
        <div
          className={cn(
            "border-sidebar-border flex items-center border-b px-3 py-4",
            collapsed && "justify-center px-2",
          )}
        >
          {header}
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {children
          ? children
          : items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
                  item.active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground ring-sebavio-gold/35 font-medium shadow-sm ring-1",
                  collapsed && "justify-center px-2",
                )}
              >
                {item.icon}
                {!collapsed ? <span>{item.label}</span> : null}
                {collapsed ? (
                  <span className="sr-only">{item.label}</span>
                ) : null}
              </Link>
            ))}
      </nav>
      {footer ? (
        <div className="border-sidebar-border border-t p-3">{footer}</div>
      ) : null}
    </aside>
  );
}
