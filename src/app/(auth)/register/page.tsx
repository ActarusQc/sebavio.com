import { RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <section className="w-full">
      <header className="mb-6 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#0E2D46] dark:text-[#0E2D46]">
          Créer un compte
        </h1>
        <p className="mt-2 text-sm text-[#5f7076] dark:text-[#5f7076]">
          Planifiez vos voyages en toute simplicité.
        </p>
      </header>
      <RegisterForm />
    </section>
  );
}
