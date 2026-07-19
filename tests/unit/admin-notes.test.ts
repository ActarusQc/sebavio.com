import { describe, expect, it } from "vitest";
import { isAppError } from "@/lib/errors";
import {
  sanitizeNoteContent,
  stripHtmlFromNote,
} from "@/features/admin/lib/note-content";

describe("sanitizeNoteContent", () => {
  it("accepte un contenu valide et retire le HTML", () => {
    expect(sanitizeNoteContent("Contacté le client")).toBe(
      "Contacté le client",
    );
    expect(stripHtmlFromNote("<b>ok</b> suite")).toBe("ok suite");
    expect(sanitizeNoteContent("<b>Note propre</b>")).toBe("Note propre");
  });

  it("rejette un mot de passe collé", () => {
    try {
      sanitizeNoteContent("password: Secret123!");
      expect.unreachable();
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("ADM_002");
      }
    }
  });

  it("rejette une clé API", () => {
    try {
      sanitizeNoteContent("api_key=sk-abcdefghijklmnopqrstuvwxyz");
      expect.unreachable();
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });

  it("rejette un contenu vide", () => {
    try {
      sanitizeNoteContent("   ");
      expect.unreachable();
    } catch (error) {
      expect(isAppError(error)).toBe(true);
    }
  });
});
