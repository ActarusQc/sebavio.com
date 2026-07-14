import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth";
import { DashboardShell } from "@/components/layout";
import { getUnreadCount } from "@/features/notifications/services";

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

  const unreadNotificationCount = await getUnreadCount(user.id);

  return (
    <DashboardShell
      email={user.email}
      role={user.role}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  );
}
