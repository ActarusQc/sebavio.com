import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser, logoutAction } from "@/features/auth";
import { ThemeToggle } from "@/components/common";
import { Footer, Header } from "@/components/layout";
import { Button } from "@/components/ui";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireActiveUser();
  } catch {
    redirect("/login");
  }

  return (
    <div className="bg-background flex min-h-full flex-col">
      <Header
        brand={
          <div>
            <p className="font-semibold">Sebavio</p>
            <p className="text-muted-foreground text-xs">
              {user.email} · {user.role}
            </p>
          </div>
        }
        actions={
          <>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Déconnexion
              </Button>
            </form>
          </>
        }
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[var(--content-max-width)] flex-1 px-6 py-8"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
