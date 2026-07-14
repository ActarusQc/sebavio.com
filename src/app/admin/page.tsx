import { ModulePlaceholder } from "@/components/layout";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ModulePlaceholder
        title="Administration"
        description="Zone réservée admin / super_admin — status re-vérifié en base."
      />
      <Button render={<Link href="/admin/campings" />}>
        Gérer les campings
      </Button>
      <Button render={<Link href="/admin/activites" />}>
        Gérer les activités
      </Button>
    </div>
  );
}
