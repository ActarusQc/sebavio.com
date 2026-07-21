import { ResetPasswordForm } from "@/features/auth";

type Props = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ?? "";
  const token = params.token ?? "";

  if (!email || !token) {
    return (
      <p className="text-destructive text-center text-sm">
        Lien de réinitialisation invalide ou incomplet.
      </p>
    );
  }

  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-sm text-[#5f7076] dark:text-[#5f7076]">
          Choisissez un nouveau mot de passe sécurisé.
        </p>
      </header>
      <ResetPasswordForm email={email} token={token} />
    </section>
  );
}
