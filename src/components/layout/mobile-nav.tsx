"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import type { UserRole } from "@/lib/constants";
import { BRAND_ASSETS } from "@/features/marketing";
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
            className="text-client-night md:hidden"
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
        <DialogHeader className="border-client-border border-b p-4">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="flex flex-col gap-1">
            <div className="relative h-10 w-36">
              <Image
                src={BRAND_ASSETS.logo}
                alt=""
                fill
                className="object-contain object-left"
                sizes="144px"
              />
            </div>
            <p className="text-client-text-muted text-[0.625rem] font-medium tracking-[0.08em] uppercase">
              Seba = étoile · Via = route
            </p>
          </div>
        </DialogHeader>
        <nav aria-label="Navigation mobile" className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const showBadge = item.href === "/dashboard/ai";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-visible:ring-sidebar-ring flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  "text-client-text hover:bg-client-pale",
                  active &&
                    "bg-client-petrol hover:bg-client-petrol font-medium text-white hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-4",
                    active ? "text-white" : "text-client-teal",
                  )}
                  aria-hidden
                >
                  <NavIcon name={item.icon} />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{item.label}</span>
                  {showBadge ? (
                    <span className="bg-client-turquoise text-client-night shrink-0 rounded-full px-1.5 py-0.5 text-[0.625rem] font-semibold">
                      Nouveau
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-client-border mt-auto border-t p-3">
          <Button
            render={
              <Link href="/dashboard/ai" onClick={() => setOpen(false)} />
            }
            className="bg-client-petrol hover:bg-client-night h-11 w-full gap-2 text-white"
          >
            <Sparkles className="size-4" aria-hidden />
            Planifier avec l’IA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
