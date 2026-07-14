"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  unreadCount: number;
  className?: string;
};

export function NotificationBell({
  unreadCount,
  className,
}: NotificationBellProps) {
  const label =
    unreadCount > 0
      ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
      : "Notifications";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      render={<Link href="/dashboard/notifications" />}
      aria-label={label}
      className={cn("relative", className)}
    >
      <Bell />
      {unreadCount > 0 ? (
        <span
          className="bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
          aria-hidden
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
