"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type UsersActionResult,
} from "@/features/users/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

const initial: UsersActionResult | undefined = undefined;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial,
  );

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <FormField htmlFor="currentPassword" label="Mot de passe actuel" required>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
        />
      </FormField>
      <FormField htmlFor="newPassword" label="Nouveau mot de passe" required>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
      </FormField>
      <FormField
        htmlFor="confirmPassword"
        label="Confirmer le nouveau mot de passe"
        required
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
        />
      </FormField>
      <p className="text-muted-foreground text-xs">
        Au moins {PASSWORD_MIN_LENGTH} caractères, avec une lettre et un
        chiffre.
      </p>
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.ok ? (
        <p
          className="text-sm text-emerald-700 dark:text-emerald-400"
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enregistrement…" : "Modifier le mot de passe"}
      </Button>
    </form>
  );
}
