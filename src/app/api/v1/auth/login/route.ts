import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";
import { loginSchema } from "@/features/auth/schemas";
import {
  handleRouteError,
  jsonFail,
  jsonOk,
} from "@/features/auth/services/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonFail("AUTH_001", "Identifiants invalides", 400);
    }

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return jsonFail("AUTH_002", "Identifiants invalides", 401);
      }
      throw error;
    }

    const session = await auth();
    if (!session?.user) {
      return jsonFail("AUTH_002", "Identifiants invalides", 401);
    }

    return jsonOk({ user: session.user });
  } catch (error) {
    return handleRouteError(error);
  }
}
