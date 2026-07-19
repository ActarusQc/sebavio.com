import { AppError } from "@/lib/errors";

const HTML_TAG_RE = /<[^>]*>/g;

/** Détecte mots de passe / clés API collés par erreur dans une note. */
export const SENSITIVE_NOTE_CONTENT_RE =
  /(?:password|mot\s*de\s*passe|passwd|pwd)\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+|secret\s*[:=]\s*\S+|bearer\s+[a-z0-9\-._~+/]+=*|sk-[a-z0-9]{16,}|ghp_[a-z0-9]{20,}|xox[baprs]-[a-z0-9-]{10,}/i;

export function stripHtmlFromNote(content: string): string {
  return content.replace(HTML_TAG_RE, "").trim();
}

/**
 * Nettoie et valide le contenu d'une note admin.
 * Rejette secrets / mots de passe collés par erreur.
 */
export function sanitizeNoteContent(raw: string): string {
  const content = stripHtmlFromNote(raw);
  if (content.length < 1) {
    throw new AppError("ADM_002", "Contenu de note requis", 400);
  }
  if (content.length > 5000) {
    throw new AppError(
      "ADM_002",
      "Contenu de note trop long (max 5000 caractères)",
      400,
    );
  }
  if (SENSITIVE_NOTE_CONTENT_RE.test(content)) {
    throw new AppError(
      "ADM_002",
      "Le contenu semble contenir un secret (mot de passe ou clé API)",
      400,
    );
  }
  return content;
}
