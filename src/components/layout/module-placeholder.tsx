import { Compass } from "lucide-react";
import { AppPageHero, EmptyState } from "@/components/common";

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
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <AppPageHero title={title} description={description} />
      <EmptyState
        title="Bientôt disponible"
        description="Aucune donnée métier pour le moment — navigation et layout uniquement."
        icon={<Compass />}
      />
    </section>
  );
}
