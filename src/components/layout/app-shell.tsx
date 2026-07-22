import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Limite la largeur du contenu dans la zone après la sidebar. */
  contained?: boolean;
};

/**
 * Coquille layout principale — fond espace client Sebavio.
 * Le main occupe l’espace restant après la sidebar (pas centré sur le viewport).
 */
export function AppShell({
  header,
  sidebar,
  footer,
  children,
  className,
  contained = true,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "workspace-shell text-foreground flex min-h-full flex-col",
        className,
      )}
    >
      {header}
      <div className="flex min-h-0 flex-1">
        {sidebar}
        <main id="main-content" className="min-w-0 flex-1 overflow-auto">
          <div
            className={cn(
              "w-full px-5 py-6 sm:px-7 sm:py-7 lg:px-9 lg:py-8",
              contained && "max-w-[var(--client-content-max,100rem)]",
            )}
          >
            {children}
          </div>
        </main>
      </div>
      {footer}
    </div>
  );
}
