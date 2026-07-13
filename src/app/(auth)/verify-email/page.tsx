import Link from "next/link";
import { verifyEmailAction } from "@/features/auth";

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ?? "";
  const token = params.token ?? "";

  if (!email || !token) {
    return (
      <p className="text-destructive text-center text-sm">
        Lien de vérification invalide ou incomplet.
      </p>
    );
  }

  const result = await verifyEmailAction(email, token);

  return (
    <section className="mx-auto w-full max-w-sm text-center">
      <h1 className="mb-4 text-xl font-semibold">Vérification du courriel</h1>
      <p
        className={
          result.ok ? "text-sm text-emerald-700" : "text-destructive text-sm"
        }
      >
        {result.message}
      </p>
      <p className="mt-6 text-sm">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </section>
  );
}
