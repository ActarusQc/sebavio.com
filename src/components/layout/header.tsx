import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type HeaderProps = {
  brand?: ReactNode;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Header applicatif (logo, recherche, actions) — coquille Partie 5.
 */
export function Header({ brand, search, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "border-border bg-background/95 sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 backdrop-blur sm:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {brand}
        {search ? (
          <div className="hidden max-w-md flex-1 md:block">{search}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
