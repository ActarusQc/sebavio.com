"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
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
  displayName?: string | null;
};

export function UserMenu({ email, role, displayName }: UserMenuProps) {
  const label = displayName?.trim() || email;
  const initial =
    (displayName?.trim() || email).trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 rounded-full border-white/15 bg-white/5 px-2.5 text-white hover:bg-white/10 hover:text-white"
            aria-label="Menu profil"
          />
        }
      >
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#3b82f6,#8b5cf6)] text-xs font-semibold text-white"
          aria-hidden
        >
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate text-xs font-medium sm:inline">
          {label}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-white/50" aria-hidden />
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
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard/subscription" />}>
          Abonnement
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
