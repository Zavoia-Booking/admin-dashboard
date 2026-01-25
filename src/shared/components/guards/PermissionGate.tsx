import React from 'react';
import { usePermissions, Permission } from '../../hooks/usePermissions';

interface PermissionGateProps {
  /**
   * Single permission required to render children
   */
  permission?: Permission;

  /**
   * Multiple permissions - user must have ALL of them
   */
  permissions?: Permission[];

  /**
   * Multiple permissions - user must have ANY of them
   */
  anyPermission?: Permission[];

  /**
   * Only render for owners (shorthand for common pattern)
   */
  ownerOnly?: boolean;

  /**
   * Content to render when user has permission
   */
  children: React.ReactNode;

  /**
   * Optional fallback to render when user lacks permission
   * If not provided, nothing is rendered
   */
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions.
 * 
 * Usage:
 * ```tsx
 * // Single permission
 * <PermissionGate permission={Permission.MANAGE_TEAM_MEMBERS}>
 *   <Button>Invite Team Member</Button>
 * </PermissionGate>
 * 
 * // Multiple permissions (ALL required)
 * <PermissionGate permissions={[Permission.MANAGE_LOCATIONS, Permission.VIEW_SETTINGS]}>
 *   <AdvancedSettings />
 * </PermissionGate>
 * 
 * // Multiple permissions (ANY required)
 * <PermissionGate anyPermission={[Permission.MANAGE_SERVICES, Permission.VIEW_SERVICES]}>
 *   <ServicesTab />
 * </PermissionGate>
 * 
 * // Owner only shorthand
 * <PermissionGate ownerOnly>
 *   <BillingSection />
 * </PermissionGate>
 * 
 * // With fallback
 * <PermissionGate 
 *   permission={Permission.MANAGE_SETTINGS} 
 *   fallback={<p>You don't have permission to manage settings</p>}
 * >
 *   <SettingsForm />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  permissions,
  anyPermission,
  ownerOnly,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isOwner } = usePermissions();

  let hasAccess = false;

  // Owner-only check (highest priority)
  if (ownerOnly) {
    hasAccess = isOwner;
  }
  // Single permission check
  else if (permission) {
    hasAccess = hasPermission(permission);
  }
  // All permissions required
  else if (permissions && permissions.length > 0) {
    hasAccess = hasAllPermissions(...permissions);
  }
  // Any permission required
  else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPermission(...anyPermission);
  }
  // No permission specified = always show (avoid silent failures)
  else {
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * HOC version for wrapping entire components
 * 
 * Usage:
 * ```tsx
 * const ProtectedBillingPage = withPermission(BillingPage, Permission.MANAGE_BILLING);
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  FallbackComponent?: React.ComponentType
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGate 
        permission={permission} 
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

export { Permission };
