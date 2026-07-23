import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui";
import { NOINDEX_FOLLOW_ROBOTS } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accès non autorisé",
  robots: NOINDEX_FOLLOW_ROBOTS,
};

/**
 * Refus d'accès explicite — pas de détail sur les permissions internes.
 * Accessible sans rôle staff (hors layout `/admin`).
 */
export default function ForbiddenPage() {
  return (
    <main className="bg-background mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center gap-6 px-4 py-16">
      <PageHeader
        title="Accès non autorisé"
        description="Votre compte n’a pas les autorisations nécessaires pour cette section."
      />
      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/dashboard" />}>
          Retour au tableau de bord
        </Button>
        <Button variant="outline" render={<Link href="/login" />}>
          Connexion
        </Button>
      </div>
    </main>
  );
}
