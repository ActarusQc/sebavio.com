"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: ActionResult | undefined = undefined;

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);

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
        {pending ? "Création…" : "Créer mon compte"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </form>
  );
}
