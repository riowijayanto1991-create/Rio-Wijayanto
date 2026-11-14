/**
 * Type definitions for Role-Based Access Control (RBAC),
 * Multi-Airport Scoping, Multi-Factor Authentication (MFA),
 * Two-Person Rule, and Tamper-Evident Audit Logging.
 */

export type UserRole = 
  | 'SuperAdmin' 
  | 'AirportAdmin' 
  | 'WildlifeOfficer' 
  | 'DataReviewer' 
  | 'Viewer';

export type Permission =
  // User & Role Management
  | 'Users.View'
  | 'Users.Manage'
  | 'Roles.Manage'
  | 'SuperAdmin.Promote'
  | 'SuperAdmin.Approve'
  // Airport & Configuration
  | 'Airports.Manage'
  | 'RiskRules.View'
  | 'RiskRules.Edit'
  // Wildlife Data
  | 'Strikes.View'
  | 'Strikes.Create'
  | 'Strikes.Edit'
  | 'Strikes.Delete'
  | 'Occurrences.View'
  | 'Occurrences.Create'
  | 'Occurrences.Edit'
  | 'Occurrences.Delete'
  | 'Patrols.View'
  | 'Patrols.Create'
  | 'Patrols.Edit'
  | 'Patrols.Delete'
  // Corrections
  | 'Corrections.Request'
  | 'Corrections.Approve'
  | 'Corrections.Reject'
  // Audit Logs
  | 'AuditLogs.View'
  | 'AuditLogs.Verify';

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  assignedAirports: string[]; // e.g. ["WIII"] or ["*"] for SuperAdmin
  isActive: boolean;
  mustChangePassword: boolean;
  mfaEnrolled: boolean;
  mfaSecret?: string; // Stored securely on server
  recoveryCodesHashed?: string[]; // SHA-256 hashes of one-time recovery codes
  securityStamp: string; // Rotated on password/role change to invalidate existing sessions
  passwordHash: string; // PBKDF2 hashed password
  passwordSalt: string;
  failedLoginAttempts: number;
  lockoutUntil: string | null; // ISO UTC string or null
  createdAt: string;
  lastLoginAt: string | null;
  lastPasswordChangedAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  securityStamp: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export interface TwoPersonRequest {
  id: string;
  action: 'PROMOTE_SUPERADMIN' | 'REVOKE_SUPERADMIN';
  actorUserId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approverUserId?: string;
  approverEmail?: string;
  approvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // UTC ISO8601
  actorUserId: string;
  actorEmail: string;
  actorIp: string;
  userAgent: string;
  action: string;
  entityType: string;
  entityId: string;
  airportId: string;
  beforeValues: Record<string, any> | null;
  afterValues: Record<string, any> | null;
  result: 'SUCCESS' | 'DENIED' | 'FAILED';
  correlationId: string;
  previousHash: string;
  rowHash: string; // SHA-256(previousHash + content)
}

export interface ChainVerificationResult {
  isValid: boolean;
  totalEntries: number;
  verifiedEntries: number;
  tamperedEntryId: string | null;
  tamperedIndex: number | null;
  message: string;
  verifiedAt: string;
}

export interface AuthSuccessPayload {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    assignedAirports: string[];
    permissions: Permission[];
    mustChangePassword: boolean;
    mfaEnrolled: boolean;
  };
  sessionToken: string;
  requiresMfa?: boolean;
  mfaToken?: string; // Short-lived token for MFA verification step
}
