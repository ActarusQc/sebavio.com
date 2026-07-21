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

const variantAccent: Record<AppPageHeroVariant, string> = {
  default: "from-sebavio-navy/8 via-sebavio-slate/5 to-transparent",
  trips: "from-sebavio-slate/12 via-sebavio-sage/8 to-transparent",
  vehicles: "from-sebavio-navy/10 via-sebavio-gold/8 to-transparent",
  maintenance: "from-sebavio-coral/10 via-sebavio-sand/10 to-transparent",
  finance: "from-sebavio-gold/12 via-sebavio-sand/8 to-transparent",
  groups: "from-sebavio-sage/12 via-sebavio-slate/6 to-transparent",
  ai: "from-sebavio-navy/12 via-sebavio-gold/10 to-transparent",
  notifications: "from-sebavio-slate/10 via-transparent to-transparent",
  settings: "from-sebavio-sand/15 via-transparent to-transparent",
};

/**
 * En-tête de page espace client — identité Sebavio (voyage, route, étoile).
 */
export function AppPageHero({
  title,
  description,
  breadcrumb,
  actions,
  variant = "default",
  className,
}: AppPageHeroProps) {
  return (
    <header
      className={cn(
        "border-sebavio-sand/50 bg-card/80 dark:bg-card/60 relative mb-6 overflow-hidden rounded-[var(--radius-card)] border shadow-[var(--shadow-sm)] dark:border-white/10",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          variantAccent[variant],
        )}
      />
      <div
        aria-hidden
        className="workspace-hero-motif pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
      />
      <div className="relative flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
        <div className="flex min-w-0 flex-col gap-2">
          {breadcrumb ? (
            <div className="text-muted-foreground text-xs">{breadcrumb}</div>
          ) : null}
          <h1 className="font-heading text-sebavio-navy dark:text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed sm:text-[0.9375rem]">
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
