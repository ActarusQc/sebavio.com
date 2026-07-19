"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  type ActionResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
  authMutedClassName,
} from "@/features/auth/lib/auth-ui";

const initial: ActionResult | undefined = undefined;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initial,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <FormField htmlFor="email" label="Courriel" required>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={authInputClassName}
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
      <Button
        type="submit"
        disabled={pending}
        className={`mt-2 ${authButtonClassName}`}
      >
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
      <p className={`mt-6 text-center ${authMutedClassName}`}>
        <Link href="/login" className={authLinkClassName}>
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
