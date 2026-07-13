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
      <h1 className="mb-6 text-center text-xl font-semibold">
        Nouveau mot de passe
      </h1>
      <ResetPasswordForm email={email} token={token} />
    </section>
  );
}
