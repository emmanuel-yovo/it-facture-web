export type PlanType = 'free' | 'starter' | 'business' | 'agency'

export const PLAN_LIMITS = {
  free: {
    maxClients: 3,
    maxInvoices: 5,
    canAccessExpenses: false,
    canAccessTickets: false,
    maxUsers: 1
  },
  starter: {
    maxClients: 50,
    maxInvoices: 50,
    canAccessExpenses: false,
    canAccessTickets: false,
    maxUsers: 1
  },
  business: {
    maxClients: Infinity,
    maxInvoices: Infinity,
    canAccessExpenses: true,
    canAccessTickets: true,
    maxUsers: 3
  },
  agency: {
    maxClients: Infinity,
    maxInvoices: Infinity,
    canAccessExpenses: true,
    canAccessTickets: true,
    maxUsers: Infinity
  }
} as const

export const canCreateClient = (plan: PlanType, currentCount: number, role?: string) => {
  if (role === 'superadmin') return true
  return currentCount < PLAN_LIMITS[plan].maxClients
}

export const canCreateInvoice = (plan: PlanType, currentCount: number, role?: string) => {
  if (role === 'superadmin') return true
  return currentCount < PLAN_LIMITS[plan].maxInvoices
}

export const canAddUser = (plan: PlanType, currentCount: number, role?: string) => {
  if (role === 'superadmin') return true
  return currentCount < PLAN_LIMITS[plan].maxUsers
}

export const canAccessFeature = (plan: PlanType, feature: 'expenses' | 'tickets', role?: string) => {
  if (role === 'superadmin') return true
  if (feature === 'expenses') return PLAN_LIMITS[plan].canAccessExpenses
  if (feature === 'tickets') return PLAN_LIMITS[plan].canAccessTickets
  return false
}
