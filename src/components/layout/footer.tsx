import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FooterProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Footer applicatif minimal — Document 7.
 */
export function Footer({ children, className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-border text-muted-foreground border-t px-4 py-4 text-xs sm:px-6",
        className,
      )}
    >
      {children ?? <p>© {year} Sebavio — L’étoile qui guide votre route</p>}
    </footer>
  );
}
