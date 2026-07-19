import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireStaffUser } from "@/features/auth";
import { getUnreadCount } from "@/features/notifications/services";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { AdminNav } from "@/features/admin/components/admin-nav";
import {
  adminEnvironmentLabel,
  resolveAdminEnvironment,
} from "@/features/admin/lib/environment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  let user;
  try {
    user = await requireStaffUser();
  } catch {
    redirect("/dashboard");
  }

  const unreadNotificationCount = await getUnreadCount(user.id);
  const envKind = resolveAdminEnvironment();
  const envLabel = adminEnvironmentLabel(envKind);

  return (
    <AdminShell
      email={user.email}
      role={user.role}
      envLabel={envLabel}
      envKind={envKind}
      unreadNotificationCount={unreadNotificationCount}
    >
      <AdminNav role={user.role} />
      {children}
    </AdminShell>
  );
}
