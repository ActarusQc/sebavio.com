import {
  GENERIC_RESEND_MESSAGE,
  resendVerificationEmail,
} from "@/features/auth/services/password-reset";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    await resendVerificationEmail(body as { email: string }, clientIp(request));
    return jsonOk({ message: GENERIC_RESEND_MESSAGE });
  } catch (error) {
    return handleRouteError(error);
  }
}
