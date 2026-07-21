import type { VoiceAgentEvent } from "@/features/ai/voice/types";

type Listener = (event: VoiceAgentEvent) => void;

/** Bus d’événements simple pour les providers vocaux (client). */
export class VoiceEventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: VoiceAgentEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // ignore listener errors
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
