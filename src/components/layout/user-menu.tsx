"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";

export type UserMenuProps = {
  email: string;
  role: string;
};

export function UserMenu({ email, role }: UserMenuProps) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-sebavio-sand/70 h-9 gap-2 rounded-full px-2.5 dark:border-white/15"
            aria-label="Menu profil"
          />
        }
      >
        <span
          className="bg-sebavio-navy text-sebavio-gold dark:bg-sebavio-gold dark:text-sebavio-navy inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold"
          aria-hidden
        >
          {initial}
        </span>
        <span className="hidden max-w-[8rem] truncate text-xs font-medium sm:inline">
          {email}
        </span>
        <UserRound className="text-muted-foreground size-3.5 sm:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="text-foreground block truncate font-medium">
              {email}
            </span>
            <span className="text-muted-foreground block text-xs font-normal">
              {role}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void logoutAction();
          }}
        >
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
