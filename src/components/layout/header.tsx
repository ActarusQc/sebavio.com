import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeaderProps = {
  brand?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Barre supérieure espace client — glass sombre premium.
 */
export function Header({ brand, search, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[rgba(5,11,28,0.85)] px-3 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {brand}
        {search ? (
          <div className="hidden max-w-xl flex-1 md:block">{search}</div>
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
