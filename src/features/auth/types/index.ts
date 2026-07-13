import type { UserRole, UserStatus } from "@/lib/constants";

export type { UserRole, UserStatus };

/** Préparation MFA — structure uniquement (non implémenté). */
export type MfaMethod = "totp" | "webauthn";

export type MfaSetupStub = {
  enabled: false;
  preferredMethod: MfaMethod | null;
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: Date | null;
};

export type AuthApiSuccess<T> = {
  success: true;
  data: T;
};

export type AuthApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type AuthApiResponse<T> = AuthApiSuccess<T> | AuthApiFailure;
