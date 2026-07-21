"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS } from "../lib/brand-assets";

const NAV_LINKS = [
  { href: "/#fonctionnalites", label: "Fonctionnalités" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/#pourquoi", label: "À propos" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-sebavio-sand/40 bg-sebavio-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-visible:ring-ring relative flex h-10 w-[11.5rem] shrink-0 items-center focus-visible:ring-2 focus-visible:outline-none sm:h-11 sm:w-[14rem]"
        >
          <Image
            src={BRAND_ASSETS.logoHorizontal}
            alt="Sebavio — L’étoile qui guide votre route"
            fill
            className="object-contain object-left"
            sizes="224px"
            priority
          />
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sebavio-navy/80 hover:text-sebavio-navy text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:gap-3 md:flex">
          <Button
            variant="outline"
            size="default"
            render={<Link href="/login" />}
          >
            Se connecter
          </Button>
          <Link
            href="/register"
            className="font-heading focus-visible:ring-ring inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-gradient-to-r from-[#f0b64d] to-[#e8923a] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none"
          >
            Commencer gratuitement
          </Link>
        </div>

        <button
          type="button"
          className="text-sebavio-navy hover:bg-sebavio-sand/20 focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-lg md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={cn(
          "border-sebavio-sand/40 bg-sebavio-background border-t px-4 py-4 md:hidden",
          !open && "hidden",
        )}
      >
        <nav className="flex flex-col gap-3" aria-label="Navigation mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sebavio-navy hover:bg-sebavio-sand/20 rounded-lg px-3 py-2.5 text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/login" />}
            >
              Se connecter
            </Button>
            <Link
              href="/register"
              className="font-heading focus-visible:ring-ring inline-flex h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-gradient-to-r from-[#f0b64d] to-[#e8923a] px-4 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none"
            >
              Commencer gratuitement
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
