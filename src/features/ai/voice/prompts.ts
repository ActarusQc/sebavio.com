import type { VoiceUsageMode } from "@/features/ai/voice/types";

/**
 * Instructions canal vocal à ajouter au prompt système (français Québec).
 */
export function buildVoiceChannelInstructions(
  usageMode: VoiceUsageMode = "conversation",
): string {
  const drivingExtra =
    usageMode === "driving"
      ? `
Mode conduite (obligatoire):
- Réponses ultra-courtes (une ou deux phrases).
- Priorité sécurité : pas de listes longues, pas de lecture de tableaux.
- Propose une seule action à la fois.
- Si confirmation requise : question claire en une phrase (« Voulez-vous que j’ajoute cette pause ? »).
`
      : `
Mode conversation:
- Réponses concises adaptées à l’oral (pas de markdown, pas de tableaux).
- Une idée principale par réponse ; détails seulement si demandé.
`;

  return `
Canal vocal (channel=voice):
- Tu parles à l’utilisateur à l’oral en français naturel du Québec.
- Mets un résumé court et parlé en premier dans « summary » (c’est ce qui sera lu à voix haute).
- Évite listes à puces, tableaux, URLs longues et jargon technique à l’oral.
- Les mutations du voyage restent des proposedAction : confirme verbalement avant d’agir.
- Ne prétends jamais modifier le voyage sans confirmation explicite.
${drivingExtra}`;
}
