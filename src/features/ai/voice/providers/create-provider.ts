import { MockVoiceProvider } from "@/features/ai/voice/providers/mock-provider";
import { OpenAiRealtimeVoiceProvider } from "@/features/ai/voice/providers/openai-realtime-provider";
import { PipelineVoiceProvider } from "@/features/ai/voice/providers/pipeline-provider";
import type {
  VoiceConversationProvider,
  VoiceProviderName,
} from "@/features/ai/voice/types";

export function createVoiceConversationProvider(
  name: VoiceProviderName,
): VoiceConversationProvider {
  switch (name) {
    case "openai_realtime":
      return new OpenAiRealtimeVoiceProvider();
    case "mock":
      return new MockVoiceProvider();
    case "pipeline":
    default:
      return new PipelineVoiceProvider();
  }
}
