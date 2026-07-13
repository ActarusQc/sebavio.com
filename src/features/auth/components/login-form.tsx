"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type ActionResult } from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: ActionResult | undefined = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

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
      <FormField htmlFor="password" label="Mot de passe" required>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </FormField>
      {state && !state.ok ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Pas de compte ?{" "}
        <Link
          href="/register"
          className="text-primary underline-offset-4 hover:underline"
        >
          S&apos;inscrire
        </Link>
        {" · "}
        <Link
          href="/forgot-password"
          className="text-primary underline-offset-4 hover:underline"
        >
          Mot de passe oublié
        </Link>
      </p>
    </form>
  );
}
