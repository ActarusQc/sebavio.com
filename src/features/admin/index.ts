/**
 * Feature `admin` — centre d'administration (Phase 1 fondation RBAC).
 */
export {
  listAdminUsers,
  getAdminUserById,
  suspendAdminUser,
  reactivateAdminUser,
  changeAdminUserRole,
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
  AuditTable,
} from "./components";

export {
  suspendUserAction,
  reactivateUserAction,
  changeUserRoleAction,
  type AdminActionResult,
} from "./actions";

export {
  adminUserListQuerySchema,
  adminUserRolePatchSchema,
  adminUserSuspendSchema,
  adminAuditQuerySchema,
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
  AdminDashboardStats,
  AdminAuditLogItem,
} from "./types";
