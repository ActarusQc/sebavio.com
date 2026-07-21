"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { UserRole } from "@/lib/constants";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { getVisibleNavItems, isNavItemActive } from "./navigation";
import { NavIcon } from "./nav-icons";

export type MobileNavProps = {
  role: UserRole;
};

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = getVisibleNavItems(role);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Ouvrir le menu"
          />
        }
      >
        <Menu />
      </DialogTrigger>
      <DialogContent
        className="bg-sidebar text-sidebar-foreground top-0 left-0 h-full max-h-full w-72 max-w-[min(18rem,85vw)] translate-x-0 translate-y-0 rounded-none p-0 sm:max-w-72"
        showCloseButton
      >
        <DialogHeader className="border-border border-b p-4">
          <DialogTitle>Navigation</DialogTitle>
        </DialogHeader>
        <nav aria-label="Navigation mobile" className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active &&
                    "bg-sidebar-accent text-sidebar-accent-foreground before:bg-sebavio-gold relative font-medium before:absolute before:top-1/2 before:left-0 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full",
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
