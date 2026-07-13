import { RegisterForm } from "@/features/auth";

export default function RegisterPage() {
  return (
    <section className="w-full">
      <h1 className="mb-6 text-center text-xl font-semibold">Inscription</h1>
      <RegisterForm />
    </section>
  );
}
