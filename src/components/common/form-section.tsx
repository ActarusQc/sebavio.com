import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormSectionProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Section visuelle de formulaire (icône + titre + champs).
 */
export function FormSection({
  title,
  description,
  icon,
  children,
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "border-sebavio-sand/50 bg-card/90 dark:bg-card/70 rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-sm)] sm:p-5 dark:border-white/10",
        className,
      )}
    >
      <header className="border-sebavio-sand/40 mb-4 flex items-start gap-3 border-b pb-3 dark:border-white/10">
        {icon ? (
          <span
            className="bg-sebavio-slate/10 text-sebavio-slate dark:bg-sebavio-slate/25 dark:text-sebavio-sage inline-flex size-9 shrink-0 items-center justify-center rounded-xl [&_svg]:size-4"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-heading text-sebavio-navy dark:text-foreground text-base font-semibold">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
