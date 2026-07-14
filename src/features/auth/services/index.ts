import { hashPassword, verifyPassword } from "./password";
import { issueVerificationToken, consumeVerificationToken } from "./tokens";
import { assertLoginRateLimit, clearLoginRateLimit } from "./rate-limit";
import { writeAuditLog } from "./audit";
import { assertUserActive, getUserStatusSnapshot } from "./user-status";
import { isAdminRole } from "./roles";
import { registerUser } from "./register";
import {
  requestPasswordReset,
  resetPassword,
  verifyEmail,
} from "./password-reset";
import { authorizeCredentials } from "./authorize";
import {
  requireActiveUser,
  requireAdminUser,
  requireSuperAdminUser,
} from "./session";

export {
  hashPassword,
  verifyPassword,
  issueVerificationToken,
  consumeVerificationToken,
  assertLoginRateLimit,
  clearLoginRateLimit,
  writeAuditLog,
  assertUserActive,
  getUserStatusSnapshot,
  isAdminRole,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  authorizeCredentials,
  requireActiveUser,
  requireAdminUser,
  requireSuperAdminUser,
};
