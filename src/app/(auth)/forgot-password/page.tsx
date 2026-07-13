import { ForgotPasswordForm } from "@/features/auth";

export default function ForgotPasswordPage() {
  return (
    <section className="w-full">
      <h1 className="mb-6 text-center text-xl font-semibold">
        Mot de passe oublié
      </h1>
      <ForgotPasswordForm />
    </section>
  );
}
