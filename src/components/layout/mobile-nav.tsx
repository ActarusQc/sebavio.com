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
            className="text-white hover:bg-white/10 md:hidden"
            aria-label="Ouvrir le menu"
          />
        }
      >
        <Menu />
      </DialogTrigger>
      <DialogContent
        className="top-0 left-0 h-full max-h-full w-72 max-w-[min(18rem,85vw)] translate-x-0 translate-y-0 rounded-none border-white/10 bg-[#071018] p-0 text-white sm:max-w-72"
        showCloseButton
      >
        <DialogHeader className="border-b border-white/10 p-4">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="flex flex-col gap-1">
            <div className="relative h-12 w-40">
              <Image
                src={BRAND_ASSETS.logoBlanc}
                alt=""
                fill
                className="object-contain object-left"
                sizes="160px"
              />
            </div>
            <p className="text-[0.6875rem] font-medium tracking-[0.06em] text-white/45 uppercase">
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
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:outline-none",
                  active &&
                    "bg-[linear-gradient(135deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35))] font-semibold text-white",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-[1.125rem]",
                    active ? "text-[#f0b64d]" : "text-[#c4b5fd]",
                  )}
                  aria-hidden
                >
                  <NavIcon name={item.icon} />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{item.label}</span>
                  {showBadge ? (
                    <span className="shrink-0 rounded-full border border-[#f0b64d]/40 bg-[rgba(240,182,77,0.15)] px-2 py-0.5 text-[0.6875rem] font-semibold text-[#f0b64d]">
                      Nouveau
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          <Button
            render={
              <Link href="/dashboard/ai" onClick={() => setOpen(false)} />
            }
            className="h-11 w-full gap-2 border-0 bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-white shadow-[0_8px_24px_rgba(59,130,246,0.35)]"
          >
            <Sparkles className="size-4" aria-hidden />
            Planifier avec Sebavio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
