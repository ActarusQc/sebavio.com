import { AppError } from "@/lib/errors";

/**
 * Vérifie que les séquences forment 1..n sans trou ni doublon.
 * Utilisé après renumérotation et en tests unitaires.
 */
export function assertContiguousSequences(sequences: number[]): void {
  if (sequences.length === 0) return;

  const sorted = [...sequences].sort((a, b) => a - b);
  const unique = new Set(sorted);
  if (unique.size !== sorted.length) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Les séquences d'étapes ne doivent pas contenir de doublons",
      400,
    );
  }

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Les séquences d'étapes doivent être contigues à partir de 1",
        400,
      );
    }
  }
}

/** Produit une liste 1..n à partir d'un ordre d'ids (ordre = nouvelle séquence). */
export function buildContiguousAssignments(
  orderedIds: string[],
): { id: string; sequence: number }[] {
  return orderedIds.map((id, index) => ({ id, sequence: index + 1 }));
}
