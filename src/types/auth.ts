export type UserRole = 'admin' | 'business_owner' | 'business_manager' | 'specialist'

export interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}

export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    permissions: [
      { resource: '*', action: 'manage' }, // Admin has full access
    ],
  },
  {
    role: 'business_owner',
    permissions: [
      { resource: 'business', action: 'manage' },
      { resource: 'specialists', action: 'manage' },
      { resource: 'analytics', action: 'read' },
      { resource: 'settings', action: 'manage' },
    ],
  },
  {
    role: 'business_manager',
    permissions: [
      { resource: 'specialists', action: 'read' },
      { resource: 'analytics', action: 'read' },
      { resource: 'settings', action: 'read' },
    ],
  },
  {
    role: 'specialist',
    permissions: [
      { resource: 'tasks', action: 'manage' },
      { resource: 'analytics', action: 'read' },
    ],
  },
]

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  businessId?: string // For business-related users
} 