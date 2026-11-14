import { Permission, UserRole } from '../../src/types/security';

/**
 * Role-to-Permissions Mapping Table.
 * Enables dynamic role adjustments without modifying application endpoints.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SuperAdmin: [
    'Users.View',
    'Users.Manage',
    'Roles.Manage',
    'SuperAdmin.Promote',
    'SuperAdmin.Approve',
    'Airports.Manage',
    'RiskRules.View',
    'RiskRules.Edit',
    'Strikes.View',
    'Strikes.Create',
    'Strikes.Edit',
    'Strikes.Delete',
    'Occurrences.View',
    'Occurrences.Create',
    'Occurrences.Edit',
    'Occurrences.Delete',
    'Patrols.View',
    'Patrols.Create',
    'Patrols.Edit',
    'Patrols.Delete',
    'Corrections.Request',
    'Corrections.Approve',
    'Corrections.Reject',
    'AuditLogs.View',
    'AuditLogs.Verify'
  ],
  AirportAdmin: [
    'Users.View',
    'Users.Manage', // Scoped to assigned airports
    'RiskRules.View',
    'Strikes.View',
    'Strikes.Create',
    'Strikes.Edit',
    'Strikes.Delete',
    'Occurrences.View',
    'Occurrences.Create',
    'Occurrences.Edit',
    'Occurrences.Delete',
    'Patrols.View',
    'Patrols.Create',
    'Patrols.Edit',
    'Patrols.Delete',
    'Corrections.Request',
    'Corrections.Approve',
    'Corrections.Reject',
    'AuditLogs.View' // Scoped to assigned airports
  ],
  DataReviewer: [
    'Users.View',
    'RiskRules.View',
    'Strikes.View',
    'Occurrences.View',
    'Patrols.View',
    'Corrections.Request',
    'Corrections.Approve',
    'Corrections.Reject'
  ],
  WildlifeOfficer: [
    'Users.View',
    'RiskRules.View',
    'Strikes.View',
    'Strikes.Create',
    'Strikes.Edit',
    'Occurrences.View',
    'Occurrences.Create',
    'Occurrences.Edit',
    'Patrols.View',
    'Patrols.Create',
    'Patrols.Edit',
    'Corrections.Request' // Can request corrections but NOT approve them
  ],
  Viewer: [
    'RiskRules.View',
    'Strikes.View',
    'Occurrences.View',
    'Patrols.View'
  ]
};

/**
 * Roles that mandate Multi-Factor Authentication (MFA)
 */
export const MANDATORY_MFA_ROLES: UserRole[] = ['SuperAdmin', 'AirportAdmin', 'DataReviewer'];

/**
 * Check if a role has a required permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

/**
 * Get all permissions granted to a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
