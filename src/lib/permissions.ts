export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  COMPTABLE: 'comptable',
  USER: 'user'
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_AGENCIES: 'manage_agencies',
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

export function hasPermission(user: any, permission: Permission): boolean {
  if (!user) return false

  // SuperAdmin has access to everything
  if (user.role === ROLES.SUPERADMIN) return true

  // If user has dynamic permissions array, use it!
  if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions.includes(permission)
  }

  // Fallback for legacy static roles (if migration is pending or permissions array is empty)
  if (user.role === ROLES.ADMIN) {
    const adminPermissions: Permission[] = [
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.MANAGE_AGENCIES,
      PERMISSIONS.MANAGE_SETTINGS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.MANAGE_DISCOUNTS,
      PERMISSIONS.VIEW_AUDIT,
      PERMISSIONS.MANAGE_EXPENSES,
      PERMISSIONS.MANAGE_REMINDERS
    ]
    return adminPermissions.includes(permission)
  }

  if (user.role === ROLES.USER || user.role === ROLES.COMPTABLE) {
    const userPermissions: Permission[] = []
    
    // Le comptable peut voir les rapports financiers
    if (user.role === ROLES.COMPTABLE) {
      userPermissions.push(PERMISSIONS.VIEW_REPORTS)
    }
    
    return userPermissions.includes(permission)
  }

  return false
}
