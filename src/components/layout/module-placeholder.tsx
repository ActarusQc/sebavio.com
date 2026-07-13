import { EmptyState, PageHeader } from "@/components/common";

export type ModulePlaceholderProps = {
  title: string;
  description?: string;
};

/**
 * Page module non encore développé — coquille Partie 6.
 */
export function ModulePlaceholder({
  title,
  description = "Ce module sera développé dans une étape ultérieure.",
}: ModulePlaceholderProps) {
  return (
    <section>
      <PageHeader title={title} description={description} />
      <EmptyState
        title="Bientôt disponible"
        description="Aucune donnée métier pour le moment — navigation et layout uniquement."
      />
    </section>
  );
}
