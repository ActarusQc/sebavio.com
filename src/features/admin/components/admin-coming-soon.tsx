import { EmptyState } from "@/components/common";
import { PageHeader } from "@/components/common";

type AdminComingSoonProps = {
  title: string;
  phase: number;
  description?: string;
};

/** Placeholder pour les sections des phases ultérieures. */
export function AdminComingSoon({
  title,
  phase,
  description,
}: AdminComingSoonProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={
          description ??
          `Cette section sera livrée en Phase ${phase} du centre d’administration.`
        }
      />
      <EmptyState
        title="Bientôt disponible"
        description={`Fondation Phase 1 en place. Contenu Phase ${phase} à venir.`}
      />
    </div>
  );
}
