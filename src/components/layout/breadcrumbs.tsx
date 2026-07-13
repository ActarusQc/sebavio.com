import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  separator?: ReactNode;
};

/**
 * Fil d’Ariane accessible (Document 7).
 */
export function Breadcrumbs({ items, className, separator }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Fil d’Ariane" className={cn("mb-4", className)}>
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1"
            >
              {index > 0
                ? (separator ?? (
                    <ChevronRight
                      className="size-3.5 shrink-0 opacity-60"
                      aria-hidden
                    />
                  ))
                : null}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="hover:text-foreground focus-visible:ring-ring rounded-sm underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(isLast && "text-foreground font-medium")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
