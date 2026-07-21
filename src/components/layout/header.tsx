import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeaderProps = {
  brand?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Header applicatif (logo mobile, recherche, actions).
 */
export function Header({ brand, search, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "border-sebavio-sand/60 bg-sebavio-background/90 sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-3 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6 dark:border-white/10 dark:bg-[#0b2235]/90",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {brand}
        {search ? (
          <div className="hidden max-w-lg flex-1 md:block">{search}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
