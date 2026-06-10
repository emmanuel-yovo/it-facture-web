export type PlanType = 'free' | 'essential' | 'pro' | 'agency'

export const PLAN_LIMITS = {
  free: {
    maxClients: 3,
    maxInvoices: 5,
    canAccessExpenses: false,
    canAccessTickets: false,
    maxUsers: 1
  },
  essential: {
    maxClients: Infinity,
    maxInvoices: Infinity,
    canAccessExpenses: false,
    canAccessTickets: false,
    maxUsers: 1
  },
  pro: {
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

export const canCreateClient = (plan: PlanType, currentCount: number) => {
  return currentCount < PLAN_LIMITS[plan].maxClients
}

export const canCreateInvoice = (plan: PlanType, currentCount: number) => {
  return currentCount < PLAN_LIMITS[plan].maxInvoices
}

export const canAccessFeature = (plan: PlanType, feature: 'expenses' | 'tickets') => {
  if (feature === 'expenses') return PLAN_LIMITS[plan].canAccessExpenses
  if (feature === 'tickets') return PLAN_LIMITS[plan].canAccessTickets
  return false
}
