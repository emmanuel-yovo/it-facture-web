import { supabase } from '../supabase'

export interface DashboardStats {
  total_revenue: number
  total_expenses: number
  net_profit: number
  monthly_revenue: number
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  partial_invoices: number
  active_clients: number
  total_clients: number
  total_services: number
  monthly_data: { month: string; revenue: number; invoices: number }[]
  top_services: { name: string; count: number; revenue: number }[]
  recent_invoices: any[]
  recent_activities: any[]
}

export class DashboardRepository {
  async getStats(workspace_id: string): Promise<DashboardStats> {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`

    // On lance plusieurs requêtes en parallèle pour la performance
    const [
      invoicesRes,
      expensesRes,
      clientsRes,
      servicesRes,
      itemsRes,
      recentInvoicesRes
    ] = await Promise.all([
      supabase.from('invoices').select('id, grand_total, status, document_type, created_at, client_id').eq('workspace_id', workspace_id).eq('document_type', 'invoice'),
      supabase.from('expenses').select('amount').eq('workspace_id', workspace_id),
      supabase.from('clients').select('id').eq('workspace_id', workspace_id),
      supabase.from('services').select('id').eq('workspace_id', workspace_id),
      supabase.from('invoice_items').select('service_name, line_total, invoice:invoices!inner(workspace_id, document_type)').eq('invoice.workspace_id', workspace_id).eq('invoice.document_type', 'invoice'),
      supabase.from('invoices').select('*, client:clients(id, full_name, company_name)').eq('workspace_id', workspace_id).eq('document_type', 'invoice').order('created_at', { ascending: false }).limit(5)
    ])

    const invoices = invoicesRes.data || []
    const expenses = expensesRes.data || []
    const clients = clientsRes.data || []
    const services = servicesRes.data || []
    const items = itemsRes.data || []
    const recentInvoices = recentInvoicesRes.data || []

    let total_revenue = 0
    let monthly_revenue = 0
    let paid_invoices = 0
    let unpaid_invoices = 0
    let partial_invoices = 0

    const uniqueClientsWithInvoices = new Set<string>()

    invoices.forEach(inv => {
      uniqueClientsWithInvoices.add(inv.client_id)
      
      if (inv.status === 'paid' || inv.status === 'partial') {
        total_revenue += Number(inv.grand_total) || 0
        if (new Date(inv.created_at) >= new Date(monthStart)) {
          monthly_revenue += Number(inv.grand_total) || 0
        }
      }

      if (inv.status === 'paid') paid_invoices++
      else if (inv.status === 'unpaid') unpaid_invoices++
      else if (inv.status === 'partial') partial_invoices++
    })

    const total_expenses = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

    // Calcul des statistiques des 6 derniers mois
    const monthlyData = []
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      
      const monthInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.created_at)
        return invDate >= mStart && invDate < mEnd
      })

      const monthRev = monthInvoices
        .filter(inv => inv.status === 'paid' || inv.status === 'partial')
        .reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0)

      monthlyData.push({
        month: months[d.getMonth()],
        revenue: monthRev,
        invoices: monthInvoices.length
      })
    }

    // Top services
    const servicesMap = new Map<string, { count: number, revenue: number }>()
    items.forEach(item => {
      if (!item.service_name) return
      const current = servicesMap.get(item.service_name) || { count: 0, revenue: 0 }
      servicesMap.set(item.service_name, {
        count: current.count + 1,
        revenue: current.revenue + (Number(item.line_total) || 0)
      })
    })

    const top_services = Array.from(servicesMap.entries())
      .map(([name, stats]) => ({ name, count: stats.count, revenue: stats.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total_revenue,
      total_expenses,
      net_profit: total_revenue - total_expenses,
      monthly_revenue,
      total_invoices: invoices.length,
      paid_invoices,
      unpaid_invoices,
      partial_invoices,
      active_clients: uniqueClientsWithInvoices.size,
      total_clients: clients.length,
      total_services: services.length,
      monthly_data: monthlyData,
      top_services,
      recent_invoices: recentInvoices,
      recent_activities: [] // À implémenter avec audit_logs si nécessaire
    }
  }
}

export const dashboardRepository = new DashboardRepository()
