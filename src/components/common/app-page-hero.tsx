import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppPageHeroVariant =
  | "default"
  | "trips"
  | "vehicles"
  | "maintenance"
  | "finance"
  | "groups"
  | "ai"
  | "notifications"
  | "settings";

export type AppPageHeroProps = {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  variant?: AppPageHeroVariant;
  className?: string;
};

/**
 * En-tête de page espace client — style nuit premium.
 */
export function AppPageHero({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: AppPageHeroProps) {
  return (
    <header
      className={cn(
        "relative mb-6 overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,30,56,0.95),rgba(26,21,64,0.85))] shadow-[0_8px_32px_rgb(0_0_0/0.28)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_20%,rgba(139,92,246,0.2),transparent_45%),radial-gradient(ellipse_at_10%_80%,rgba(59,130,246,0.15),transparent_50%)]"
      />
      <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 flex-col gap-2">
          {breadcrumb ? (
            <div className="text-xs text-white/45">{breadcrumb}</div>
          ) : null}
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-white/65 sm:text-[0.9375rem]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
