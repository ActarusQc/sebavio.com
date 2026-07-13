import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FooterProps = {
  children?: ReactNode;
  className?: string;
};

/**
 * Footer minimal (version, liens support) — Document 7.
 */
export function Footer({ children, className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-border text-muted-foreground border-t px-4 py-4 text-xs sm:px-6",
        className,
      )}
    >
      {children ?? <p>Sebavio — Compagnon de voyage intelligent</p>}
    </footer>
  );
}
