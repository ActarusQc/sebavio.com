import type { UserRole, UserStatus } from "@/lib/constants";

export type AdminNoteCategory =
  "general" | "support" | "security" | "billing" | "account";

export type AdminNoteImportance = "normal" | "important" | "critical";

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
  lastLoginAt: string | null;
};

export type AdminUserTripSummary = {
  id: string;
  title: string;
  status: string;
  departureDate: string;
  destination: string;
  createdAt: string;
};

export type AdminUserVehicleSummary = {
  id: string;
  nickname: string | null;
  licensePlate: string | null;
  label: string | null;
  createdAt: string;
};

export type AdminUserDetail = AdminUserListItem & {
  lastActivityAt: string | null;
  isLastActiveSuperAdmin: boolean;
  sessionVersion: number;
  passwordChangedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  suspendedById: string | null;
  suspensionEndsAt: string | null;
  reactivatedAt: string | null;
  reactivatedById: string | null;
  activeSessionCount: number;
  notesCount: number;
  recentTrips: AdminUserTripSummary[];
  vehicles: AdminUserVehicleSummary[];
};

export type AdminUserNoteItem = {
  id: string;
  userId: string;
  authorId: string;
  authorEmail: string | null;
  category: AdminNoteCategory;
  importance: AdminNoteImportance;
  content: string;
  createdAt: string;
  updatedAt: string;
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
