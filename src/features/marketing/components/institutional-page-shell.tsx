import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/features/marketing";

export function InstitutionalPageShell({
  children,
  jsonLd,
}: {
  children: ReactNode;
  jsonLd?: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      {jsonLd}
      <SiteHeader variant="light" />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
