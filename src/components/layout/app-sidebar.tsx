"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeft, Sparkles } from "lucide-react";
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
      className="border-client-border bg-sidebar"
      header={
        <Link
          href="/dashboard"
          className={cn(
            "focus-visible:ring-sidebar-ring relative flex flex-col gap-1 focus-visible:ring-2 focus-visible:outline-none",
            collapsed ? "items-center" : "items-start",
          )}
          aria-label="Sebavio — Tableau de bord"
        >
          <span
            className={cn(
              "relative block",
              collapsed ? "h-10 w-10" : "h-11 w-full max-w-[11rem]",
            )}
          >
            <Image
              src={BRAND_ASSETS.logo}
              alt="Sebavio — L’étoile qui guide votre route"
              fill
              className="object-contain object-left"
              sizes={collapsed ? "40px" : "176px"}
              priority
            />
          </span>
          {!collapsed ? (
            <span className="text-client-text-muted text-[0.625rem] font-medium tracking-[0.08em] uppercase">
              Seba = étoile · Via = route
            </span>
          ) : null}
        </Link>
      }
      footer={
        <div className="flex flex-col gap-3">
          {!collapsed ? (
            <div className="from-client-night to-client-petrol relative hidden overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-[var(--client-shadow)] lg:block">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
              >
                <svg
                  viewBox="0 0 200 120"
                  className="absolute inset-0 h-full w-full"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <path
                    d="M0 90 L40 55 L70 75 L110 40 L150 70 L200 35 L200 120 L0 120 Z"
                    fill="rgb(52 124 135 / 0.45)"
                  />
                  <path
                    d="M0 100 Q60 70 100 85 T200 60"
                    fill="none"
                    stroke="rgb(247 198 77 / 0.55)"
                    strokeWidth="2"
                  />
                  <circle cx="160" cy="28" r="2" fill="#F7C64D" />
                  <circle cx="40" cy="22" r="1.5" fill="#F7C64D" />
                  <circle cx="95" cy="18" r="1.2" fill="#fff" opacity="0.7" />
                </svg>
              </div>
              <div className="relative space-y-3">
                <p className="font-heading text-sm font-semibold">
                  Planifiez plus intelligemment
                </p>
                <p className="text-xs leading-relaxed text-white/80">
                  Laissez l’IA vous aider à créer votre prochaine aventure.
                </p>
                <Button
                  render={<Link href="/dashboard/ai" />}
                  size="sm"
                  className="text-client-night hover:bg-client-beige h-10 w-full gap-2 rounded-xl border-0 bg-white font-medium shadow-none"
                >
                  <Sparkles className="size-3.5" aria-hidden />
                  Planifier un voyage
                </Button>
              </div>
            </div>
          ) : null}
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
        </div>
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
              "focus-visible:ring-sidebar-ring relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none",
              "text-client-text hover:bg-client-pale dark:text-sidebar-foreground dark:hover:bg-sidebar-accent",
              active &&
                "bg-client-petrol hover:bg-client-petrol dark:bg-client-petrol font-medium text-white hover:text-white",
              collapsed && "justify-center px-2",
            )}
          >
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-4",
                active
                  ? "text-white"
                  : "text-client-teal dark:text-client-teal",
              )}
              aria-hidden
            >
              <NavIcon name={item.icon} />
            </span>
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                <span className="truncate">{item.label}</span>
                {showBadge ? (
                  <span className="bg-client-turquoise text-client-night shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold">
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
