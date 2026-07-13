import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/auth";

export default async function AdminPage() {
  try {
    await requireAdminUser();
  } catch {
    redirect("/dashboard");
  }

  return (
    <main className="px-6 py-8">
      <h1 className="text-2xl font-semibold">Administration</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Zone réservée admin / super_admin — status re-vérifié en base.
      </p>
    </main>
  );
}
