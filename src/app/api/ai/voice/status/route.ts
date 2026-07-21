import { handleRouteError, jsonOk } from "@/features/auth/services/http";
import { requireActiveUser } from "@/features/auth/services/session";
import { resolveVoiceAccess } from "@/features/ai/voice/access";
import { getVoicePublicConfig } from "@/features/ai/voice/config";
import { getMonthlyVoiceSeconds } from "@/features/ai/voice/services/usage";

/**
 * GET /api/ai/voice/status — état public de l’agent vocal pour l’utilisateur.
 */
export async function GET() {
  try {
    const user = await requireActiveUser();
    const publicConfig = getVoicePublicConfig();
    const access = await resolveVoiceAccess(user.id);
    const monthlySecondsUsed = await getMonthlyVoiceSeconds(user.id);

    return jsonOk({
      enabled: publicConfig.enabled,
      webEnabled: publicConfig.webEnabled,
      canUseVoice: access.canUseVoice && publicConfig.enabled,
      provider: publicConfig.provider,
      unavailableMessage: publicConfig.unavailableMessage,
      monthlySecondsUsed,
      monthlySecondsLimit: publicConfig.maxMonthlySeconds,
      defaultLanguage: publicConfig.defaultLanguage,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
