"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  loginAction,
  resendVerificationAction,
  type ActionResult,
} from "@/features/auth/actions";
import { FormField } from "@/components/common";
import { Button, Input } from "@/components/ui";

const initial: ActionResult | undefined = undefined;

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [resendState, resendAction, resendPending] = useActionState(
    resendVerificationAction,
    initial,
  );
  const [emailValue, setEmailValue] = useState("");

  const showResend =
    state &&
    !state.ok &&
    state.code === "AUTH_004" &&
    Boolean(state.email ?? emailValue);

  const resendEmail = state && !state.ok ? (state.email ?? emailValue) : "";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField htmlFor="email" label="Courriel" required>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
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
      </form>

      {showResend ? (
        <form action={resendAction} className="flex flex-col gap-2">
          <input type="hidden" name="email" value={resendEmail} />
          {resendState?.ok ? (
            <p className="text-success text-sm" role="status">
              {resendState.message}
            </p>
          ) : null}
          {resendState && !resendState.ok ? (
            <p className="text-destructive text-sm" role="alert">
              {resendState.message}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            disabled={resendPending}
            className="w-full"
          >
            {resendPending ? "Envoi…" : "Renvoyer le courriel de vérification"}
          </Button>
        </form>
      ) : null}

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
    </div>
  );
}
