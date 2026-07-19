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
import {
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
  authMutedClassName,
} from "@/features/auth/lib/auth-ui";

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
    <div className="flex w-full flex-col">
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
            className={authInputClassName}
          />
        </FormField>
        <FormField htmlFor="password" label="Mot de passe" required>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={authInputClassName}
          />
        </FormField>
        {state && !state.ok ? (
          <p className="text-destructive text-sm" role="alert">
            {state.message}
          </p>
        ) : null}
        <p className="text-right text-sm">
          <Link href="/forgot-password" className={authLinkClassName}>
            Mot de passe oublié
          </Link>
        </p>
        <Button
          type="submit"
          disabled={pending}
          className={`mt-2 ${authButtonClassName}`}
        >
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      {showResend ? (
        <form action={resendAction} className="mt-4 flex flex-col gap-2">
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
            className="h-14 w-full rounded-2xl border-[#e5e0d6] bg-white text-[#0E2D46] dark:border-[#e5e0d6] dark:bg-white dark:text-[#0E2D46]"
          >
            {resendPending ? "Envoi…" : "Renvoyer le courriel de vérification"}
          </Button>
        </form>
      ) : null}

      <p className={`mt-6 text-center ${authMutedClassName}`}>
        Pas de compte ?{" "}
        <Link href="/register" className={authLinkClassName}>
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
