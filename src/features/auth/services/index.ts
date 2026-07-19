import { hashPassword, verifyPassword } from "./password";
import { issueVerificationToken, consumeVerificationToken } from "./tokens";
import { assertLoginRateLimit, clearLoginRateLimit } from "./rate-limit";
import { writeAuditLog } from "./audit";
import { assertUserActive, getUserStatusSnapshot } from "./user-status";
import { isAdminRole } from "./roles";
import { registerUser } from "./register";
import {
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "./password-reset";
import { assertEmailAuthRateLimit } from "./email-rate-limit";
import { authorizeCredentials } from "./authorize";
import {
  requireActiveUser,
  requireStaffUser,
  requirePermission,
  requireAdminUser,
  requireSuperAdminUser,
  requireAnyAdminUser,
} from "./session";
import { adminAccessRedirectPath } from "./admin-access";

export {
  hashPassword,
  verifyPassword,
  issueVerificationToken,
  consumeVerificationToken,
  assertLoginRateLimit,
  clearLoginRateLimit,
  assertEmailAuthRateLimit,
  writeAuditLog,
  assertUserActive,
  getUserStatusSnapshot,
  isAdminRole,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
  authorizeCredentials,
  requireActiveUser,
  requireStaffUser,
  requirePermission,
  requireAdminUser,
  requireSuperAdminUser,
  requireAnyAdminUser,
  adminAccessRedirectPath,
};
