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
        "flex h-full flex-col rounded-[1.25rem] border border-white/10 bg-[rgba(12,30,56,0.85)] p-5 shadow-[0_8px_32px_rgb(0_0_0/0.28)] backdrop-blur-sm transition-shadow duration-200 hover:border-white/16 hover:shadow-[0_12px_40px_rgb(0_0_0/0.4)] sm:p-6",
        className,
      )}
    >
      {title ? (
        <h2 className="font-heading mb-4 text-base font-semibold tracking-tight text-white">
          {title}
        </h2>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? (
        <div className="mt-5 border-t border-white/10 pt-4">{footer}</div>
      ) : null}
    </section>
  );
}
