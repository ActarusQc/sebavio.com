import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <section className="w-full">
      <h1 className="mb-6 text-center text-xl font-semibold">Connexion</h1>
      <LoginForm />
    </section>
  );
}
