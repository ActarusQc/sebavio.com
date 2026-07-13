"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ActionResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: ActionResult | undefined = undefined;

type Props = {
  email: string;
  token: string;
};

export function ResetPasswordForm({ email, token }: Props) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initial,
  );

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <FormField htmlFor="password" label="Nouveau mot de passe" required>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </FormField>
      {state ? (
        <p
          className={
            state.ok ? "text-success text-sm" : "text-destructive text-sm"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : "Réinitialiser"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Connexion
        </Link>
      </p>
    </form>
  );
}
