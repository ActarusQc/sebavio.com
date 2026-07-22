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
  default: "from-client-petrol/8 via-client-teal/5 to-transparent",
  trips: "from-client-teal/12 via-client-turquoise/40 to-transparent",
  vehicles: "from-client-night/10 via-client-star/10 to-transparent",
  maintenance: "from-sebavio-coral/10 via-client-beige/40 to-transparent",
  finance: "from-client-star/15 via-client-beige/30 to-transparent",
  groups: "from-client-green-soft/40 via-client-teal/8 to-transparent",
  ai: "from-client-night/10 via-client-star/12 to-transparent",
  notifications: "from-client-petrol/10 via-transparent to-transparent",
  settings: "from-client-beige/50 via-transparent to-transparent",
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
        "border-client-border bg-client-warm-white/90 relative mb-6 overflow-hidden rounded-[var(--client-radius)] border shadow-[var(--client-shadow)] dark:border-white/10",
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
            <div className="text-client-text-muted text-xs">{breadcrumb}</div>
          ) : null}
          <h1 className="font-heading text-client-night dark:text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-client-text-muted max-w-2xl text-sm leading-relaxed sm:text-[0.9375rem]">
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
