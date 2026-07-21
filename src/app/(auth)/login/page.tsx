import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
          Connexion à votre compte
        </h1>
        <p className="mt-2 text-sm text-[#5f7076] dark:text-[#5f7076]">
          Accédez à tous vos voyages.
        </p>
      </header>
      <LoginForm />
    </section>
  );
}
