import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireActiveUser } from "@/features/auth";
import { DashboardShell } from "@/components/layout";
import { getUnreadCount } from "@/features/notifications/services";
import { ensureProfile } from "@/features/users/services/profile";

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

  const [unreadNotificationCount, profile] = await Promise.all([
    getUnreadCount(user.id),
    ensureProfile(user.id),
  ]);

  const displayName =
    [profile.firstName, profile.lastName]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(" ") || null;

  return (
    <DashboardShell
      email={user.email}
      role={user.role}
      displayName={displayName}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  );
}
