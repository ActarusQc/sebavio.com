import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type MetricCardVariant =
  "neutral" | "info" | "success" | "warning" | "danger";

export type MetricCardProps = {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  description?: string;
  variant?: MetricCardVariant;
  trend?: ReactNode;
  href?: string;
  className?: string;
};

const variantStyles: Record<
  MetricCardVariant,
  { shell: string; icon: string; value: string }
> = {
  neutral: {
    shell: "border-sebavio-sand/55 dark:border-white/10",
    icon: "bg-sebavio-slate/10 text-sebavio-slate dark:bg-sebavio-slate/25 dark:text-sebavio-sage",
    value: "text-sebavio-navy dark:text-foreground",
  },
  info: {
    shell: "border-sebavio-slate/30 dark:border-sebavio-slate/40",
    icon: "bg-sebavio-slate/15 text-sebavio-slate dark:bg-sebavio-slate/30 dark:text-[#b8d4d6]",
    value: "text-sebavio-navy dark:text-foreground",
  },
  success: {
    shell: "border-sebavio-sage/35 dark:border-sebavio-sage/40",
    icon: "bg-sebavio-sage/15 text-sebavio-sage dark:bg-sebavio-sage/25 dark:text-sebavio-sage",
    value: "text-sebavio-navy dark:text-foreground",
  },
  warning: {
    shell: "border-sebavio-gold/40 dark:border-sebavio-gold/35",
    icon: "bg-sebavio-gold/20 text-[#b8860b] dark:bg-sebavio-gold/20 dark:text-sebavio-gold",
    value: "text-sebavio-navy dark:text-foreground",
  },
  danger: {
    shell: "border-sebavio-coral/35 dark:border-sebavio-coral/40",
    icon: "bg-sebavio-coral/15 text-sebavio-coral dark:bg-sebavio-coral/25 dark:text-[#f0a090]",
    value: "text-sebavio-coral dark:text-[#f0a090]",
  },
};

/**
 * Carte métrique réutilisable (dashboard, entretien, finances).
 */
export function MetricCard({
  title,
  value,
  icon,
  description,
  variant = "neutral",
  trend,
  href,
  className,
}: MetricCardProps) {
  const styles = variantStyles[variant];
  const content = (
    <div
      className={cn(
        "group/metric bg-card/90 dark:bg-card/70 flex h-full flex-col gap-3 rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] motion-safe:hover:-translate-y-0.5",
        styles.shell,
        href &&
          "focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </p>
        {icon ? (
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4",
              styles.icon,
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "font-heading text-2xl font-semibold tracking-tight tabular-nums",
          styles.value,
        )}
      >
        {value}
      </p>
      {description || trend ? (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          {description ? (
            <p className="text-muted-foreground text-xs leading-snug">
              {description}
            </p>
          ) : null}
          {trend}
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
