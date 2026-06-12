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
  monthly_data: { month: string; revenue: number; expenses: number; invoices: number }[]
  top_services: { name: string; count: number; revenue: number }[]
  top_clients: { name: string; revenue: number }[]
  recent_invoices: any[]
  recent_activities: any[]
  trends: {
    revenue: number
    expenses: number
    profit: number
    invoices: number
  }
}

export class DashboardRepository {
  async getStats(workspace_id: string, startDate?: string, endDate?: string): Promise<DashboardStats> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Si aucune date fournie, on prend le mois en cours
    const start = startDate ? new Date(startDate) : monthStart
    const end = endDate ? new Date(endDate) : now
    
    // Calcul de la période précédente pour les tendances
    const duration = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - duration)
    const prevEnd = start

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
      supabase.from('expenses').select('amount, created_at').eq('workspace_id', workspace_id),
      supabase.from('clients').select('id, full_name, company_name').eq('workspace_id', workspace_id),
      supabase.from('services').select('id').eq('workspace_id', workspace_id),
      supabase.from('invoice_items').select('service_name, line_total, invoice:invoices!inner(workspace_id, document_type, created_at)').eq('invoice.workspace_id', workspace_id).eq('invoice.document_type', 'invoice'),
      supabase.from('invoices').select('*, client:clients(id, full_name, company_name)').eq('workspace_id', workspace_id).eq('document_type', 'invoice').order('created_at', { ascending: false }).limit(5)
    ])

    const allInvoices = invoicesRes.data || []
    const allExpenses = expensesRes.data || []
    const clients = clientsRes.data || []
    const services = servicesRes.data || []
    const items = itemsRes.data || []
    const recentInvoices = recentInvoicesRes.data || []

    // Filtrer pour la période actuelle
    const currentInvoices = allInvoices.filter(inv => {
      const d = new Date(inv.created_at)
      return d >= start && d <= end
    })
    
    const currentExpenses = allExpenses.filter(exp => {
      const d = new Date(exp.created_at)
      return d >= start && d <= end
    })

    // Filtrer pour la période précédente (tendances)
    const prevInvoices = allInvoices.filter(inv => {
      const d = new Date(inv.created_at)
      return d >= prevStart && d < prevEnd
    })
    
    const prevExpenses = allExpenses.filter(exp => {
      const d = new Date(exp.created_at)
      return d >= prevStart && d < prevEnd
    })

    // --- CALCUL PÉRIODE ACTUELLE ---
    let total_revenue = 0
    let paid_invoices = 0
    let unpaid_invoices = 0
    let partial_invoices = 0
    const uniqueClientsWithInvoices = new Set<string>()

    currentInvoices.forEach(inv => {
      uniqueClientsWithInvoices.add(inv.client_id)
      
      if (inv.status === 'paid' || inv.status === 'partial') {
        total_revenue += Number(inv.grand_total) || 0
      }

      if (inv.status === 'paid') paid_invoices++
      else if (inv.status === 'unpaid') unpaid_invoices++
      else if (inv.status === 'partial') partial_invoices++
    })

    const total_expenses = currentExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    const net_profit = total_revenue - total_expenses

    // --- CALCUL PÉRIODE PRÉCÉDENTE (POUR TENDANCES) ---
    let prev_revenue = 0
    prevInvoices.forEach(inv => {
      if (inv.status === 'paid' || inv.status === 'partial') {
        prev_revenue += Number(inv.grand_total) || 0
      }
    })
    const prev_expenses = prevExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
    const prev_profit = prev_revenue - prev_expenses
    const prev_invoices_count = prevInvoices.length

    // Helper pour calculer le pourcentage d'évolution
    const calcTrend = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0
      return Math.round(((current - prev) / prev) * 100)
    }

    const trends = {
      revenue: calcTrend(total_revenue, prev_revenue),
      expenses: calcTrend(total_expenses, prev_expenses),
      profit: calcTrend(net_profit, prev_profit),
      invoices: calcTrend(currentInvoices.length, prev_invoices_count)
    }

    // --- CALCULS GLOBAUX / HISTORIQUES ---
    
    // Calcul des statistiques mensuelles (toujours les 6 derniers mois pour avoir un graphe lisible)
    const monthlyData = []
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      
      const monthInvoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.created_at)
        return invDate >= mStart && invDate < mEnd
      })

      const monthExpenses = allExpenses.filter(exp => {
        const expDate = new Date(exp.created_at)
        return expDate >= mStart && expDate < mEnd
      })

      const monthRev = monthInvoices
        .filter(inv => inv.status === 'paid' || inv.status === 'partial')
        .reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0)

      const monthExp = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)

      monthlyData.push({
        month: months[d.getMonth()],
        revenue: monthRev,
        expenses: monthExp,
        invoices: monthInvoices.length
      })
    }

    // Top services (sur la période actuelle)
    const servicesMap = new Map<string, { count: number, revenue: number }>()
    items.forEach(item => {
      // Filtrer les items par date de facture
      const invDate = new Date(item.invoice?.created_at)
      if (invDate < start || invDate > end) return

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

    // Top clients (sur la période actuelle)
    const clientsMap = new Map<string, { name: string, revenue: number }>()
    currentInvoices.forEach(inv => {
      if (inv.status !== 'paid' && inv.status !== 'partial') return
      
      const client = clients.find(c => c.id === inv.client_id)
      const name = client ? (client.company_name || client.full_name) : 'Client Inconnu'
      
      const current = clientsMap.get(inv.client_id) || { name, revenue: 0 }
      clientsMap.set(inv.client_id, {
        name,
        revenue: current.revenue + (Number(inv.grand_total) || 0)
      })
    })

    const top_clients = Array.from(clientsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    return {
      total_revenue,
      total_expenses,
      net_profit,
      monthly_revenue: total_revenue, // Gardé pour rétrocompatibilité
      total_invoices: currentInvoices.length,
      paid_invoices,
      unpaid_invoices,
      partial_invoices,
      active_clients: uniqueClientsWithInvoices.size,
      total_clients: clients.length,
      total_services: services.length,
      monthly_data: monthlyData,
      top_services,
      top_clients,
      recent_invoices: recentInvoices,
      recent_activities: [], // À implémenter avec audit_logs si nécessaire
      trends
    }
  }
}

export const dashboardRepository = new DashboardRepository()
