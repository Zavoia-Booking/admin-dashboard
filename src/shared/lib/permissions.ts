import { UserRole } from '../types/auth';

/**
 * Permission-based access control system
 * 
 * This module defines all permissions and maps them to roles.
 * Structured for easy migration to backend-driven permissions later.
 * 
 * To migrate to backend:
 * 1. Add `permissions: Permission[]` to the /me response
 * 2. Update getPermissionsForUser() to read from user.permissions
 * 3. Keep ROLE_PERMISSIONS as fallback for backwards compatibility
 */

// =============================================================================
// PERMISSIONS
// =============================================================================

/**
 * All available permissions in the system.
 * Naming convention: action:resource (e.g., view:locations, manage:team_members)
 * 
 * Actions:
 * - view: Can see/read the resource
 * - manage: Can create, update, delete the resource
 * - access: Can access the feature/page
 */
export enum Permission {
  // ===========================================
  // SHARED PAGES (used by both Owner & Team Member)
  // ===========================================

  // Dashboard
  ACCESS_DASHBOARD = 'access:dashboard',

  // Calendar
  ACCESS_CALENDAR = 'access:calendar',
  VIEW_ALL_APPOINTMENTS = 'view:all_appointments', // See all team members' appointments
  VIEW_OWN_APPOINTMENTS = 'view:own_appointments', // See only own appointments

  // Support (global ticketing, not business-specific)
  ACCESS_SUPPORT = 'access:support',

  // ===========================================
  // OWNER-ONLY PAGES
  // ===========================================

  // Locations
  ACCESS_LOCATIONS = 'access:locations',
  VIEW_LOCATIONS = 'view:locations',
  MANAGE_LOCATIONS = 'manage:locations',

  // Services
  ACCESS_SERVICES = 'access:services',
  VIEW_SERVICES = 'view:services',
  MANAGE_SERVICES = 'manage:services',

  // Team Members
  ACCESS_TEAM_MEMBERS = 'access:team_members',
  VIEW_TEAM_MEMBERS = 'view:team_members',
  MANAGE_TEAM_MEMBERS = 'manage:team_members', // Invite, edit, remove

  // Customers (owner view - all customers)
  ACCESS_CUSTOMERS = 'access:customers',
  VIEW_CUSTOMERS = 'view:customers',
  MANAGE_CUSTOMERS = 'manage:customers',

  // Assignments (owner manages assignments for team members)
  ACCESS_ASSIGNMENTS = 'access:assignments',
  VIEW_ASSIGNMENTS = 'view:assignments',
  MANAGE_ASSIGNMENTS = 'manage:assignments',

  // Marketplace (business marketplace settings)
  ACCESS_MARKETPLACE = 'access:marketplace',
  VIEW_MARKETPLACE = 'view:marketplace',
  MANAGE_MARKETPLACE = 'manage:marketplace',

  // Settings (business settings)
  ACCESS_SETTINGS = 'access:settings',
  ACCESS_SETTINGS_PROFILE = 'access:settings_profile', // Business profile
  ACCESS_SETTINGS_BILLING = 'access:settings_billing', // Subscription, payments
  ACCESS_SETTINGS_ADVANCED = 'access:settings_advanced', // Business settings
  VIEW_SETTINGS = 'view:settings',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_BILLING = 'manage:billing', // Subscription, payments

  // Marketplace sub-routes (owner)
  ACCESS_MARKETPLACE_PROFILE = 'access:marketplace_profile',
  ACCESS_MARKETPLACE_PORTFOLIO = 'access:marketplace_portfolio',
  ACCESS_MARKETPLACE_PROMOTIONS = 'access:marketplace_promotions',

  // ===========================================
  // TEAM MEMBER-ONLY PAGES (separate routes)
  // ===========================================

  // My Assignments - view what's assigned to them at current business
  // Tabs: Services, Bundles, Locations
  ACCESS_MY_ASSIGNMENTS = 'access:my_assignments',

  // My Customers - customers who booked with them at current business
  ACCESS_MY_CUSTOMERS = 'access:my_customers',

  // My Profile - personal marketplace profile (global, not business-specific)
  // Tabs: Profile, Portfolio, Reviews
  ACCESS_MY_PROFILE = 'access:my_profile',
  ACCESS_MY_PROFILE_INFO = 'access:my_profile_info',
  ACCESS_MY_PROFILE_PORTFOLIO = 'access:my_profile_portfolio',
  ACCESS_MY_PROFILE_REVIEWS = 'access:my_profile_reviews',

  // My Settings - personal account settings
  // Google auth, reset password, reset email, logout, delete account
  ACCESS_MY_SETTINGS = 'access:my_settings',
}

// =============================================================================
// ROLE -> PERMISSIONS MAPPING
// =============================================================================

/**
 * Maps each role to its allowed permissions.
 * Owner gets all permissions.
 * Team member gets a restricted subset.
 */
/**
 * Owner permissions - access to all owner routes
 */
const OWNER_PERMISSIONS: Permission[] = [
  // Shared pages
  Permission.ACCESS_DASHBOARD,
  Permission.ACCESS_CALENDAR,
  Permission.VIEW_ALL_APPOINTMENTS,
  Permission.ACCESS_SUPPORT,

  // Owner-only pages
  Permission.ACCESS_LOCATIONS,
  Permission.VIEW_LOCATIONS,
  Permission.MANAGE_LOCATIONS,

  Permission.ACCESS_SERVICES,
  Permission.VIEW_SERVICES,
  Permission.MANAGE_SERVICES,

  Permission.ACCESS_TEAM_MEMBERS,
  Permission.VIEW_TEAM_MEMBERS,
  Permission.MANAGE_TEAM_MEMBERS,

  Permission.ACCESS_CUSTOMERS,
  Permission.VIEW_CUSTOMERS,
  Permission.MANAGE_CUSTOMERS,

  Permission.ACCESS_ASSIGNMENTS,
  Permission.VIEW_ASSIGNMENTS,
  Permission.MANAGE_ASSIGNMENTS,

  Permission.ACCESS_MARKETPLACE,
  Permission.VIEW_MARKETPLACE,
  Permission.MANAGE_MARKETPLACE,
  Permission.ACCESS_MARKETPLACE_PROFILE,
  Permission.ACCESS_MARKETPLACE_PORTFOLIO,
  Permission.ACCESS_MARKETPLACE_PROMOTIONS,

  Permission.ACCESS_SETTINGS,
  Permission.ACCESS_SETTINGS_PROFILE,
  Permission.ACCESS_SETTINGS_BILLING,
  Permission.ACCESS_SETTINGS_ADVANCED,
  Permission.VIEW_SETTINGS,
  Permission.MANAGE_SETTINGS,
  Permission.MANAGE_BILLING,
];

/**
 * Team member permissions - separate routes, no overlap with owner management pages
 */
const TEAM_MEMBER_PERMISSIONS: Permission[] = [
  // Shared pages (same routes as owner)
  Permission.ACCESS_DASHBOARD,
  Permission.ACCESS_CALENDAR,
  Permission.VIEW_OWN_APPOINTMENTS,
  Permission.ACCESS_SUPPORT,

  // Team member-only pages (separate routes)
  Permission.ACCESS_MY_ASSIGNMENTS,
  Permission.ACCESS_MY_CUSTOMERS,
  Permission.ACCESS_MY_PROFILE,
  Permission.ACCESS_MY_PROFILE_INFO,
  Permission.ACCESS_MY_PROFILE_PORTFOLIO,
  Permission.ACCESS_MY_PROFILE_REVIEWS,
  Permission.ACCESS_MY_SETTINGS,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: OWNER_PERMISSIONS,
  [UserRole.TEAM_MEMBER]: TEAM_MEMBER_PERMISSIONS,
};

// =============================================================================
// PERMISSION UTILITIES
// =============================================================================

export type AuthUser = {
  role?: string;
  permissions?: Permission[]; // Future: backend-provided permissions
  // ... other user fields
};

/**
 * Get permissions for a user.
 * 
 * Currently uses role-based mapping.
 * To migrate to backend: check user.permissions first, fallback to role mapping.
 */
export function getPermissionsForUser(user: AuthUser | null): Permission[] {
  if (!user) return [];

  // Future: If backend provides permissions, use them
  // if (user.permissions && user.permissions.length > 0) {
  //   return user.permissions;
  // }

  // Current: Map role to permissions
  const role = user.role as UserRole;
  if (!role || !ROLE_PERMISSIONS[role]) {
    return [];
  }

  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  const permissions = getPermissionsForUser(user);
  return permissions.includes(permission);
}

/**
 * Check if a user has ALL of the specified permissions
 */
export function hasAllPermissions(user: AuthUser | null, requiredPermissions: Permission[]): boolean {
  const permissions = getPermissionsForUser(user);
  return requiredPermissions.every(p => permissions.includes(p));
}

/**
 * Check if a user has ANY of the specified permissions
 */
export function hasAnyPermission(user: AuthUser | null, requiredPermissions: Permission[]): boolean {
  const permissions = getPermissionsForUser(user);
  return requiredPermissions.some(p => permissions.includes(p));
}

// =============================================================================
// ROUTE PERMISSION MAPPING
// =============================================================================

/**
 * Maps base routes to required permissions.
 * Used by ProtectedRoute for automatic access control.
 * 
 * Routes are separated by role to avoid if/else logic in components.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  // ===========================================
  // SHARED ROUTES (Owner & Team Member)
  // ===========================================
  '/dashboard': Permission.ACCESS_DASHBOARD,
  '/calendar': Permission.ACCESS_CALENDAR,
  '/support': Permission.ACCESS_SUPPORT,

  // ===========================================
  // OWNER-ONLY ROUTES
  // ===========================================
  '/locations': Permission.ACCESS_LOCATIONS,
  '/services': Permission.ACCESS_SERVICES,
  '/team-members': Permission.ACCESS_TEAM_MEMBERS,
  '/customers': Permission.ACCESS_CUSTOMERS,
  '/assignments': Permission.ACCESS_ASSIGNMENTS,
  '/marketplace': Permission.ACCESS_MARKETPLACE,
  '/settings': Permission.ACCESS_SETTINGS,

  // ===========================================
  // TEAM MEMBER-ONLY ROUTES
  // ===========================================
  '/my-assignments': Permission.ACCESS_MY_ASSIGNMENTS,
  '/my-customers': Permission.ACCESS_MY_CUSTOMERS,
  '/my-profile': Permission.ACCESS_MY_PROFILE,
  '/my-settings': Permission.ACCESS_MY_SETTINGS,
};

/**
 * Maps specific sub-routes (with query params) to required permissions.
 * Format: 'pathname?key=value' -> Permission
 * These take precedence over base route permissions.
 */
export const SUB_ROUTE_PERMISSIONS: Record<string, Permission> = {
  // ===========================================
  // OWNER SUB-ROUTES
  // ===========================================
  
  // Settings tabs
  '/settings?tab=profile': Permission.ACCESS_SETTINGS_PROFILE,
  '/settings?tab=billing': Permission.ACCESS_SETTINGS_BILLING,
  '/settings?tab=advanced': Permission.ACCESS_SETTINGS_ADVANCED,
  
  // Marketplace tabs
  '/marketplace?tab=profile': Permission.ACCESS_MARKETPLACE_PROFILE,
  '/marketplace?tab=portfolio': Permission.ACCESS_MARKETPLACE_PORTFOLIO,
  '/marketplace?tab=promotions': Permission.ACCESS_MARKETPLACE_PROMOTIONS,

  // ===========================================
  // TEAM MEMBER SUB-ROUTES
  // ===========================================
  
  // My Profile tabs (global marketplace profile)
  '/my-profile?tab=profile': Permission.ACCESS_MY_PROFILE_INFO,
  '/my-profile?tab=portfolio': Permission.ACCESS_MY_PROFILE_PORTFOLIO,
  '/my-profile?tab=reviews': Permission.ACCESS_MY_PROFILE_REVIEWS,
};

/**
 * Get required permission for a route path.
 * Checks sub-routes (query params) first, then falls back to base route.
 */
export function getRoutePermission(pathname: string, search?: string): Permission | null {
  // Check sub-route permissions first (more specific)
  // Parse query params to match against SUB_ROUTE_PERMISSIONS
  if (search) {
    const searchParams = new URLSearchParams(search);
    
    // Check each sub-route permission pattern
    for (const [pattern, permission] of Object.entries(SUB_ROUTE_PERMISSIONS)) {
      const [patternPath, patternSearch] = pattern.split('?');
      
      if (pathname === patternPath && patternSearch) {
        const patternParams = new URLSearchParams(patternSearch);
        let matches = true;
        
        // Check if all pattern params match current URL params
        for (const [key, value] of patternParams.entries()) {
          if (searchParams.get(key) !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          return permission;
        }
      }
    }
  }

  // Fallback to base route permission
  return ROUTE_PERMISSIONS[pathname] || null;
}
