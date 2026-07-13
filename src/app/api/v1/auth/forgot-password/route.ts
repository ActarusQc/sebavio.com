import { requestPasswordReset } from "@/features/auth/services/password-reset";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    await requestPasswordReset(body as { email: string }, clientIp(request));
    return jsonOk({
      message:
        "Si un compte existe pour ce courriel, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
