"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  forgotPasswordAction,
  type ActionResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: ActionResult | undefined = undefined;

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initial,
  );

  return (
    <form
      action={formAction}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <FormField htmlFor="email" label="Courriel" required>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
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
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
