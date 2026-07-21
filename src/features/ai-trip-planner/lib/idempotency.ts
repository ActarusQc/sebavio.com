/** Logique d’idempotence testable sans Prisma. */
export function resolveCreateIdempotency(input: {
  existingTripId: string | null;
  status: string;
}): { tripId: string; alreadyCreated: true } | null {
  if (input.existingTripId) {
    return { tripId: input.existingTripId, alreadyCreated: true };
  }
  return null;
}
