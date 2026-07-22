import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

/**
 * État vide chaleureux — identité Sebavio (voyage / préparation).
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "border-client-border bg-client-warm-white/80 dark:bg-card/50 relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[var(--client-radius)] border border-dashed px-6 py-12 text-center shadow-[var(--client-shadow)] dark:border-white/10",
        className,
      )}
    >
      <div
        aria-hidden
        className="from-client-petrol/8 to-client-star/10 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent"
      />
      <div className="relative flex flex-col items-center gap-4">
        {icon ? (
          <div
            className="bg-client-pale text-client-teal dark:bg-client-petrol/40 flex size-14 items-center justify-center rounded-2xl [&_img]:size-8 [&_svg]:size-7"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
        <div className="flex max-w-md flex-col gap-1.5">
          <p className="font-heading text-client-night dark:text-foreground text-base font-semibold">
            {title}
          </p>
          {description ? (
            <p className="text-client-text-muted text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {action || secondaryAction ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}
