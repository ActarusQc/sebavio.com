import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function DashboardCard({
  title,
  children,
  footer,
  className,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "border-client-border bg-client-surface flex h-full flex-col rounded-[var(--client-radius)] border p-5 shadow-[var(--client-shadow)] transition-shadow duration-200 hover:shadow-[var(--client-shadow-hover)] sm:p-6",
        className,
      )}
    >
      {title ? (
        <h2 className="font-heading text-client-text mb-4 text-base font-semibold tracking-tight">
          {title}
        </h2>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? (
        <div className="border-client-border mt-5 border-t pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
