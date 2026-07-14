/**
 * Feature `admin` — portail d'administration (Doc 10 Partie 20).
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
  assertNotLastActiveSuperAdmin,
  removesActiveSuperAdminPrivilege,
} from "./services";

export {
  AdminNav,
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

export type {
  AdminUserListItem,
  AdminUserDetail,
  AdminDashboardStats,
  AdminAuditLogItem,
} from "./types";
