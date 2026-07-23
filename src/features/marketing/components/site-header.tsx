"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BRAND_ASSETS } from "../lib/brand-assets";
import { MarketingCtaButton } from "./marketing-cta-button";

const NAV_LINKS = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/#comment-ca-fonctionne", label: "Comment ça fonctionne" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
] as const;

export type SiteHeaderProps = {
  /** `dark` : header nuit (landing). `light` : pages claires. */
  variant?: "dark" | "light";
};

export function SiteHeader({ variant = "light" }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const isDark = variant === "dark";

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        isDark
          ? "border-b border-white/[0.08] bg-[#050b1c]/88 text-white backdrop-blur-md"
          : "border-sebavio-sand/40 bg-sebavio-background/90 border-b backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-[5.15rem] max-w-[100rem] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[5.4rem] lg:px-10">
        <Link
          href="/"
          className={cn(
            "focus-visible:ring-ring relative flex shrink-0 items-center focus-visible:ring-2 focus-visible:outline-none",
            isDark
              ? "h-12 w-[13.5rem] sm:h-[3.25rem] sm:w-[16rem]"
              : "h-10 w-[11.5rem] sm:h-11 sm:w-[14rem]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- logo marque, pas d’optimisation Image */}
          <img
            src={
              isDark
                ? BRAND_ASSETS.logoHorizontalSidebar
                : BRAND_ASSETS.logoHorizontal
            }
            alt="Sebavia — L’étoile qui guide votre route"
            className="h-full w-full object-contain object-left"
          />
        </Link>

        <nav
          className="hidden items-center gap-7 xl:flex"
          aria-label="Navigation principale"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[0.9375rem] font-medium transition-colors",
                isDark
                  ? "text-white/80 hover:text-white"
                  : "text-sebavio-navy/80 hover:text-sebavio-navy",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isDark ? (
            <>
              <Link
                href="/login"
                className="focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white focus-visible:ring-2 focus-visible:outline-none"
              >
                Connexion
              </Link>
              <MarketingCtaButton href="/register">
                Planifier mon voyage
              </MarketingCtaButton>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <button
          type="button"
          className={cn(
            "focus-visible:ring-ring inline-flex size-10 items-center justify-center rounded-lg md:hidden",
            isDark
              ? "text-white hover:bg-white/10"
              : "text-sebavio-navy hover:bg-sebavio-sand/20",
          )}
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
          "border-t px-4 py-4 md:hidden",
          isDark
            ? "border-white/10 bg-[#050b1c]/95"
            : "border-sebavio-sand/40 bg-sebavio-background",
          !open && "hidden",
        )}
      >
        <nav className="flex flex-col gap-3" aria-label="Navigation mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium",
                isDark
                  ? "text-white hover:bg-white/10"
                  : "text-sebavio-navy hover:bg-sebavio-sand/20",
              )}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/login"
              className={cn(
                "inline-flex h-11 items-center justify-center rounded-[var(--radius-button)] border text-sm font-medium",
                isDark
                  ? "border-white/25 text-white"
                  : "border-sebavio-sand text-sebavio-navy",
              )}
              onClick={() => setOpen(false)}
            >
              Connexion
            </Link>
            <MarketingCtaButton
              href="/register"
              className="h-11 w-full"
              onClick={() => setOpen(false)}
            >
              Planifier mon voyage
            </MarketingCtaButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
