"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";
import {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
  authMutedClassName,
} from "@/features/auth/lib/auth-ui";

const initial: ActionResult | undefined = undefined;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

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
      <FormField
        htmlFor="password"
        label="Mot de passe"
        required
        hint="Au moins 8 caractères, une lettre et un chiffre."
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
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
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <p className={`mt-6 text-center ${authMutedClassName}`}>
        Déjà inscrit ?{" "}
        <Link href="/login" className={authLinkClassName}>
          Se connecter
        </Link>
      </p>
    </form>
  );
}
