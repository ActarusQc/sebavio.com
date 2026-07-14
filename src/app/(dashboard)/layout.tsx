import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { DashboardShell } from "@/components/layout";
import { getUnreadCount } from "@/features/notifications/services";

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
