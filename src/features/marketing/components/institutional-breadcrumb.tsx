import Link from "next/link";
import { cn } from "@/lib/utils";

type Crumb = { href?: string; label: string };

export function InstitutionalBreadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Fil d’Ariane" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[#3b82f6]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
            >
              {index > 0 ? (
                <span className="text-[#60758a]" aria-hidden>
                  /
                </span>
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-[#082b46]" : undefined}
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
