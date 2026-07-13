/**
 * Feature `auth` — hooks (MFA stub / futurs hooks client).
 */

export type UseMfaStub = {
  enabled: false;
};

export function getMfaStub(): UseMfaStub {
  return { enabled: false };
}
