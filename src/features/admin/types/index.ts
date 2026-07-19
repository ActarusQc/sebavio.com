import type { UserRole, UserStatus } from "@/lib/constants";

export type AdminUserListItem = {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  emailVerified: string | null;
  firstName: string | null;
  lastName: string | null;
  vehicleCount: number;
  tripCount: number;
};

export type AdminUserDetail = AdminUserListItem & {
  lastActivityAt: string | null;
  isLastActiveSuperAdmin: boolean;
};

export type AdminDashboardStats = {
  usersTotal: number;
  usersActive: number;
  usersSuspended: number;
  registrationsLast7Days: number;
  registrationsLast30Days: number;
  vehiclesTotal: number;
  tripsTotal: number;
  campgroundsTotal: number;
  activitiesTotal: number;
  auditLogsLast24h: number;
  cachedAt: string;
};

export type AdminAuditLogItem = {
  id: string;
  userId: string | null;
  userEmail: string | null;
  actorRole: string | null;
  entity: string;
  entityId: string | null;
  action: string;
  reason: string | null;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  requestId: string | null;
  createdAt: string;
};
