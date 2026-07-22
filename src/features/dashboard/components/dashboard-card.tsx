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
        "border-client-border bg-client-warm-white flex h-full flex-col rounded-[var(--client-radius)] border p-5 shadow-[var(--client-shadow)] sm:p-6",
        className,
      )}
    >
      {title ? (
        <h2 className="text-client-text mb-4 text-sm font-semibold tracking-wide uppercase">
          {title}
        </h2>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? (
        <div className="border-client-border mt-4 border-t pt-3">{footer}</div>
      ) : null}
    </section>
  );
}
