export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  COMPTABLE: 'comptable',
  USER: 'user'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_FEDAPAY: 'manage_fedapay',
  VIEW_REPORTS: 'view_reports',
  MANAGE_DISCOUNTS: 'manage_discounts',
  VIEW_AUDIT: 'view_audit',
  VIEW_SUPERADMIN_DASHBOARD: 'view_superadmin_dashboard',
  MANAGE_EXPENSES: 'manage_expenses',
  MANAGE_REMINDERS: 'manage_reminders'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export function hasPermission(userRole: Role | string | undefined | null, permission: Permission): boolean {
  if (!userRole) return false

  // SuperAdmin has access to everything
  if (userRole === ROLES.SUPERADMIN) return true

  // Admin permissions
  if (userRole === ROLES.ADMIN) {
    const adminPermissions: Permission[] = [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_DISCOUNTS,
      PERMISSIONS.VIEW_AUDIT,
      PERMISSIONS.MANAGE_EXPENSES,
      PERMISSIONS.MANAGE_REMINDERS
    ]
    return adminPermissions.includes(permission)
  }

  // User & Comptable permissions (very restricted, none of the sensitive pages)
  if (userRole === ROLES.USER || userRole === ROLES.COMPTABLE) {
    const userPermissions: Permission[] = [] // Add specific permissions if needed later
    return userPermissions.includes(permission)
  }

  return false
}
