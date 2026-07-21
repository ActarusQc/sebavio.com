export const WELCOME_MESSAGE =
  "Bonjour! Je vais vous aider à créer votre prochain voyage. Vous pouvez déjà avoir une destination précise ou simplement une idée générale. Quel type de voyage aimeriez-vous faire?";

export const INITIAL_QUICK_REPLIES = [
  "Road trip",
  "Escapade",
  "Voyage en famille",
  "Voyage en couple",
  "J’ai déjà une destination",
  "Je cherche des idées",
] as const;

export const ACTIVE_SESSION_STATUSES = [
  "collecting",
  "proposing",
  "ready_for_confirmation",
] as const;

export const SESSION_RETENTION_DAYS = 30;
