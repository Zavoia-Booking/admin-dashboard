import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { selectCurrentUser } from '../../features/auth/selectors';
import { 
  Permission, 
  getPermissionsForUser, 
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermissions,
} from '../lib/permissions';
import { UserRole } from '../types/auth';

/**
 * Hook for checking user permissions in components.
 * 
 * Usage:
 * ```tsx
 * const { hasPermission, isOwner } = usePermissions();
 * 
 * // Single permission check
 * if (hasPermission(Permission.MANAGE_TEAM_MEMBERS)) {
 *   // show invite button
 * }
 * 
 * // Multiple permissions (ANY)
 * if (hasAnyPermission(Permission.MANAGE_LOCATIONS, Permission.VIEW_LOCATIONS)) {
 *   // show locations tab
 * }
 * ```
 */
export function usePermissions() {
  const user = useSelector(selectCurrentUser);

  // Memoize permissions array to avoid recalculation on every render
  const permissions = useMemo(() => getPermissionsForUser(user), [user]);

  const role = user?.role as UserRole | undefined;

  // Convenience checks for common role patterns
  const isOwner = role === UserRole.OWNER;
  const isTeamMember = role === UserRole.TEAM_MEMBER;

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(user, permission);
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (...requiredPermissions: Permission[]): boolean => {
    return checkAllPermissions(user, requiredPermissions);
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (...requiredPermissions: Permission[]): boolean => {
    return checkAnyPermissions(user, requiredPermissions);
  };

  /**
   * Check if user can manage (create/update/delete) a resource
   * Convenience method that checks for the manage:* permission
   */
  const canManage = (resource: 'locations' | 'services' | 'team_members' | 'customers' | 'assignments' | 'marketplace' | 'settings' | 'billing'): boolean => {
    const permissionMap: Record<string, Permission> = {
      locations: Permission.MANAGE_LOCATIONS,
      services: Permission.MANAGE_SERVICES,
      team_members: Permission.MANAGE_TEAM_MEMBERS,
      customers: Permission.MANAGE_CUSTOMERS,
      assignments: Permission.MANAGE_ASSIGNMENTS,
      marketplace: Permission.MANAGE_MARKETPLACE,
      settings: Permission.MANAGE_SETTINGS,
      billing: Permission.MANAGE_BILLING,
    };
    return hasPermission(permissionMap[resource]);
  };

  /**
   * Check if user can view a resource
   * Convenience method that checks for the view:* permission
   */
  const canView = (resource: 'locations' | 'services' | 'team_members' | 'customers' | 'assignments' | 'marketplace' | 'settings' | 'all_appointments' | 'own_appointments'): boolean => {
    const permissionMap: Record<string, Permission> = {
      locations: Permission.VIEW_LOCATIONS,
      services: Permission.VIEW_SERVICES,
      team_members: Permission.VIEW_TEAM_MEMBERS,
      customers: Permission.VIEW_CUSTOMERS,
      assignments: Permission.VIEW_ASSIGNMENTS,
      marketplace: Permission.VIEW_MARKETPLACE,
      settings: Permission.VIEW_SETTINGS,
      all_appointments: Permission.VIEW_ALL_APPOINTMENTS,
      own_appointments: Permission.VIEW_OWN_APPOINTMENTS,
    };
    return hasPermission(permissionMap[resource]);
  };

  /**
   * Check if user can access a page/feature
   * Convenience method that checks for the access:* permission
   */
  const canAccess = (feature: 'dashboard' | 'calendar' | 'locations' | 'services' | 'team_members' | 'customers' | 'assignments' | 'marketplace' | 'settings' | 'support'): boolean => {
    const permissionMap: Record<string, Permission> = {
      dashboard: Permission.ACCESS_DASHBOARD,
      calendar: Permission.ACCESS_CALENDAR,
      locations: Permission.ACCESS_LOCATIONS,
      services: Permission.ACCESS_SERVICES,
      team_members: Permission.ACCESS_TEAM_MEMBERS,
      customers: Permission.ACCESS_CUSTOMERS,
      assignments: Permission.ACCESS_ASSIGNMENTS,
      marketplace: Permission.ACCESS_MARKETPLACE,
      settings: Permission.ACCESS_SETTINGS,
      support: Permission.ACCESS_SUPPORT,
    };
    return hasPermission(permissionMap[feature]);
  };

  return {
    // Raw data
    user,
    role,
    permissions,

    // Role checks
    isOwner,
    isTeamMember,

    // Permission checks
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,

    // Convenience methods
    canManage,
    canView,
    canAccess,
  };
}

export { Permission };
