"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  Fuel,
  LayoutDashboard,
  MapPin,
  Package,
  ScrollText,
  Settings,
  Sparkles,
  Tent,
  Users,
  Webhook,
} from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";
import { ADMIN_NAV_ITEMS, ROLE_LABELS } from "@/features/admin/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/subscriptions": CreditCard,
  "/admin/payments": CreditCard,
  "/admin/invoices": FileText,
  "/admin/webhooks/stripe": Webhook,
  "/admin/plans": Package,
  "/admin/analytics": BarChart3,
  "/admin/ai": Sparkles,
  "/admin/audit": ScrollText,
  "/admin/settings": Settings,
  "/admin/campings": Tent,
  "/admin/activites": MapPin,
  "/admin/catalogue-carburant": Fuel,
};

type AdminSidebarProps = {
  role: UserRole;
  email: string;
  envLabel: string;
  envKind: "development" | "test" | "production";
  collapsed?: boolean;
};

export function AdminSidebar({
  role,
  email,
  envLabel,
  envKind,
  collapsed = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter((item) =>
    hasPermission(role, item.permission),
  );

  const envClass =
    envKind === "production"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : envKind === "test"
        ? "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-200"
        : "bg-sebavio-navy/10 text-sebavio-navy dark:text-sebavio-gold border-sebavio-navy/20";

  return (
    <aside
      className={cn(
        "border-border bg-card flex h-full flex-col border-r",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="border-border flex flex-col gap-2 border-b p-4">
        <Link
          href="/admin"
          className="font-heading text-sebavio-navy dark:text-sebavio-gold text-lg font-semibold tracking-tight"
        >
          {collapsed ? "S" : "Sebavio Admin"}
        </Link>
        {!collapsed ? (
          <span
            className={cn(
              "inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
              envClass,
            )}
          >
            {envLabel}
          </span>
        ) : null}
      </div>

      <nav
        aria-label="Administration"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2"
      >
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.href] ?? Activity;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sebavio-navy dark:bg-sebavio-gold dark:text-sebavio-navy font-medium text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={item.label}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {!collapsed ? (
                <span className="truncate">
                  {item.label}
                  {!item.available ? (
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      (bientôt)
                    </span>
                  ) : null}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="border-border border-t p-3 text-xs">
          <p className="text-foreground truncate font-medium">{email}</p>
          <p className="text-muted-foreground">{ROLE_LABELS[role] ?? role}</p>
          <Link
            href="/dashboard"
            className="text-sebavio-navy dark:text-sebavio-gold mt-2 inline-block underline-offset-2 hover:underline"
          >
            Retour à l’espace utilisateur
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
