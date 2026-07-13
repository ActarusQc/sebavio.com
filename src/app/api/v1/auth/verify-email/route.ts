import { verifyEmail } from "@/features/auth/services/password-reset";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    await verifyEmail(
      body as { email: string; token: string },
      clientIp(request),
    );
    return jsonOk({ verified: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
