import { resetPassword } from "@/features/auth/services/password-reset";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    await resetPassword(
      body as { email: string; token: string; password: string },
      clientIp(request),
    );
    return jsonOk({ reset: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
