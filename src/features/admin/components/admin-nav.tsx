"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/constants";
import { hasPermission } from "@/lib/rbac";
import { ADMIN_NAV_ITEMS } from "@/features/admin/constants";
import { cn } from "@/lib/utils";

type AdminNavProps = {
  role: UserRole;
};

/** Nav horizontale compacte (mobile / secours) — filtre par permissions. */
export function AdminNav({ role }: AdminNavProps) {
  const pathname = usePathname();
  const items = ADMIN_NAV_ITEMS.filter(
    (item) => item.available && hasPermission(role, item.permission),
  );

  return (
    <nav
      aria-label="Administration"
      className="mb-6 flex flex-wrap gap-1 border-b pb-3 md:hidden"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
