/**
 * Feature `admin` — centre d'administration (Phase 1 fondation RBAC + Phase 2 support users).
 */
export {
  listAdminUsers,
  getAdminUserById,
  suspendAdminUser,
  reactivateAdminUser,
  changeAdminUserRole,
  buildAdminUserListWhere,
  bumpSessionVersion,
  revokeUserSessions,
  listAdminUserNotes,
  createAdminUserNote,
  updateAdminUserNote,
  deleteAdminUserNote,
  adminSendPasswordReset,
  adminResendVerification,
  exportAdminUsersCsv,
  ADMIN_USER_EXPORT_MAX_ROWS,
  listAdminAuditLogs,
  getAdminDashboardStats,
  assertActorCanActOnTarget,
  assertActorCanAssignRole,
  assertNotLastActiveSuperAdmin,
  removesActiveSuperAdminPrivilege,
  writeAdminAuditLog,
  sanitizeAuditPayload,
} from "./services";

export {
  AdminNav,
  AdminShell,
  AdminSidebar,
  AdminComingSoon,
  DashboardStats,
  UsersTable,
  UserDetailPanel,
  AdminNotesPanel,
  AuditTable,
} from "./components";

export {
  suspendUserAction,
  reactivateUserAction,
  changeUserRoleAction,
  revokeSessionsAction,
  sendPasswordResetAction,
  resendVerificationAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
  type AdminActionResult,
} from "./actions";

export {
  adminUserListQuerySchema,
  adminUserRolePatchSchema,
  adminUserSuspendSchema,
  adminUserReactivateSchema,
  adminUserRevokeSessionsSchema,
  adminUserPasswordResetSchema,
  adminUserResendVerificationSchema,
  adminUserNoteCreateSchema,
  adminUserNoteUpdateSchema,
  adminAuditQuerySchema,
  ADMIN_NOTE_CATEGORIES,
  ADMIN_NOTE_IMPORTANCES,
  ADMIN_USER_LIST_SORTS,
} from "./schemas";

export {
  ADMIN_PERMISSIONS,
  ROLE_PERMISSIONS,
  STAFF_ROLES,
  hasPermission,
  canAccessAdminPortal,
  isStaffRole,
  isContentAdminRole,
  canAssignRole,
  listPermissions,
  type AdminPermission,
  type StaffRole,
} from "@/lib/rbac";

export type {
  AdminUserListItem,
  AdminUserDetail,
  AdminUserTripSummary,
  AdminUserVehicleSummary,
  AdminUserNoteItem,
  AdminNoteCategory,
  AdminNoteImportance,
  AdminDashboardStats,
  AdminAuditLogItem,
} from "./types";
