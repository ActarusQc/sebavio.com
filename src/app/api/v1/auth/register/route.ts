import { registerUser } from "@/features/auth/services/register";
import {
  clientIp,
  handleRouteError,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const user = await registerUser(
      body as { email: string; password: string },
      clientIp(request),
    );
    return jsonOk(
      {
        user: { id: user.id, email: user.email },
        message:
          "Compte créé. Vérifiez votre courriel avant de vous connecter.",
      },
      201,
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
