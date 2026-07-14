"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "@/features/auth/schemas";
import { EmailUnverifiedError } from "@/features/auth/errors";
import { registerUser } from "@/features/auth/services/register";
import {
  GENERIC_RESEND_MESSAGE,
  GENERIC_RESET_MESSAGE,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "@/features/auth/services/password-reset";
import { isAppError } from "@/lib/errors";

export type ActionResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      message: string;
      code?: string;
      email?: string;
    };

async function actionClientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function isEmailUnverifiedError(error: unknown): boolean {
  if (error instanceof EmailUnverifiedError) {
    return true;
  }
  if (error instanceof AuthError && "code" in error) {
    return error.code === "AUTH_004";
  }
  return false;
}

export async function registerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    await registerUser(parsed.data);
    return {
      ok: true,
      message: "Compte créé. Vérifiez votre courriel pour activer le compte.",
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Inscription impossible" };
  }
}

export async function loginAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Identifiants invalides" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (error) {
    if (isEmailUnverifiedError(error)) {
      return {
        ok: false,
        code: "AUTH_004",
        email: parsed.data.email,
        message:
          "Courriel non vérifié. Utilisez le lien ci-dessous pour recevoir un nouveau courriel de vérification.",
      };
    }
    if (error instanceof AuthError) {
      return { ok: false, message: "Identifiants invalides" };
    }
    // Next.js redirect throw — propager
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Courriel invalide",
    };
  }

  try {
    await requestPasswordReset(parsed.data, await actionClientIp());
    return {
      ok: true,
      message: GENERIC_RESET_MESSAGE,
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Demande impossible" };
  }
}

export async function resendVerificationAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resendVerificationSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Courriel invalide",
    };
  }

  try {
    await resendVerificationEmail(parsed.data, await actionClientIp());
    return {
      ok: true,
      message: GENERIC_RESEND_MESSAGE,
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Demande impossible" };
  }
}

export async function resetPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    await resetPassword(parsed.data);
    return {
      ok: true,
      message: "Mot de passe mis à jour. Vous pouvez vous connecter.",
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Réinitialisation impossible" };
  }
}

export async function verifyEmailAction(
  email: string,
  token: string,
): Promise<ActionResult> {
  const parsed = verifyEmailSchema.safeParse({ email, token });
  if (!parsed.success) {
    return { ok: false, message: "Lien invalide" };
  }

  try {
    await verifyEmail(parsed.data);
    return {
      ok: true,
      message: "Courriel vérifié. Vous pouvez vous connecter.",
    };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: "Vérification impossible" };
  }
}
