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
            className="border-client-border text-client-text hover:bg-client-pale h-10 gap-2 rounded-full px-2.5 dark:border-white/15"
            aria-label="Menu profil"
          />
        }
      >
        <span
          className="bg-client-night text-client-star inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold"
          aria-hidden
        >
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate text-xs font-medium sm:inline">
          {label}
        </span>
        <ChevronDown
          className="text-client-text-muted size-3.5 shrink-0"
          aria-hidden
        />
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
