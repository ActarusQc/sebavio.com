import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/common";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <p className="text-2xl font-semibold tracking-tight">Sebavio</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Compagnon de voyage intelligent
        </p>
      </div>
      {children}
    </main>
  );
}
