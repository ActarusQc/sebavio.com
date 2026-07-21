import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Contenu max-width (Document 7 : 1440 px). */
  contained?: boolean;
};

/**
 * Coquille layout principale — fond espace client Sebavio.
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
        <main
          id="main-content"
          className={cn(
            "flex-1 overflow-auto px-3 py-5 sm:px-6 sm:py-6 lg:px-8",
            contained && "mx-auto w-full max-w-[var(--content-max-width)]",
          )}
        >
          {children}
        </main>
      </div>
      {footer}
    </div>
  );
}
