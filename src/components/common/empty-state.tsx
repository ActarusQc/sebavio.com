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
 * État vide — style nuit premium.
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
        "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-[1.25rem] border border-dashed border-white/15 bg-[rgba(12,30,56,0.6)] px-6 py-12 text-center shadow-[0_8px_32px_rgb(0_0_0/0.2)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_60%)]"
      />
      <div className="relative flex flex-col items-center gap-4">
        {icon ? (
          <div
            className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.3))] text-[#c4b5fd] [&_img]:size-8 [&_svg]:size-7"
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
        <div className="flex max-w-md flex-col gap-1.5">
          <p className="font-heading text-base font-semibold text-white">
            {title}
          </p>
          {description ? (
            <p className="text-sm leading-relaxed text-white/60">
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
