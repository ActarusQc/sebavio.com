import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth";
import { DashboardShell } from "@/components/layout";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireAdminUser();
  } catch {
    redirect("/dashboard");
  }

  return (
    <DashboardShell email={user.email} role={user.role}>
      {children}
    </DashboardShell>
  );
}
