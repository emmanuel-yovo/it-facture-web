import { supabase } from '../supabase'

export class ReportRepository {
  async getRevenueByClient(workspace_id: string, dateFrom?: string, dateTo?: string): Promise<{ client_name: string; revenue: number }[]> {
    let query = supabase
      .from('invoices')
      .select('grand_total, status, client:clients(full_name)')
      .eq('workspace_id', workspace_id)
      .eq('document_type', 'invoice')
      .in('status', ['paid', 'partial'])

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const { data, error } = await query

    if (error) throw error

    const clientMap = new Map<string, number>()
    
    data.forEach((inv: any) => {
      const clientName = inv.client?.full_name || 'Client inconnu'
      const amount = Number(inv.grand_total) || 0
      clientMap.set(clientName, (clientMap.get(clientName) || 0) + amount)
    })

    return Array.from(clientMap.entries()).map(([client_name, revenue]) => ({ client_name, revenue }))
  }

  async getRevenueByService(workspace_id: string, dateFrom?: string, dateTo?: string): Promise<{ service_name: string; revenue: number }[]> {
    let query = supabase
      .from('invoice_items')
      .select('service_name, line_total, invoice:invoices!inner(workspace_id, document_type, status, created_at)')
      .eq('invoice.workspace_id', workspace_id)
      .eq('invoice.document_type', 'invoice')

    if (dateFrom) query = query.gte('invoice.created_at', dateFrom)
    if (dateTo) query = query.lte('invoice.created_at', dateTo)

    const { data, error } = await query

    if (error) throw error

    const serviceMap = new Map<string, number>()

    data.forEach((item: any) => {
      // On ne compte que les factures payées ou partielles pour le revenu réel
      if (item.invoice?.status === 'paid' || item.invoice?.status === 'partial') {
        const serviceName = item.service_name || 'Service inconnu'
        const amount = Number(item.line_total) || 0
        serviceMap.set(serviceName, (serviceMap.get(serviceName) || 0) + amount)
      }
    })

    return Array.from(serviceMap.entries()).map(([service_name, revenue]) => ({ service_name, revenue }))
  }
  async getTopClients(workspace_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('grand_total, status, client:clients(id, full_name, company_name)')
      .eq('workspace_id', workspace_id)
      .eq('document_type', 'invoice')
      .in('status', ['paid', 'partial'])
    
    if (error) throw error

    const map = new Map<string, any>()
    data.forEach((inv: any) => {
      const clientId = inv.client?.id || 'unknown'
      if (!map.has(clientId)) {
        map.set(clientId, { id: clientId, name: inv.client?.full_name || 'Inconnu', company: inv.client?.company_name || '', total_spent: 0, invoice_count: 0 })
      }
      const c = map.get(clientId)
      c.total_spent += Number(inv.grand_total) || 0
      c.invoice_count += 1
    })

    return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent).slice(0, 5)
  }

  async getFinancialSummary(workspace_id: string): Promise<any[]> {
    const { data: invs, error: invError } = await supabase.from('invoices').select('grand_total, status, created_at').eq('workspace_id', workspace_id).eq('document_type', 'invoice')
    const { data: exps, error: expError } = await supabase.from('expenses').select('amount, expense_date').eq('workspace_id', workspace_id)
    
    if (invError) throw invError
    if (expError) throw expError

    // Group by month
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    const monthlyData = months.map(m => ({ month: m, revenue: 0, expenses: 0 }))

    invs?.forEach(i => {
      if (i.status === 'paid' || i.status === 'partial') {
        const monthIdx = new Date(i.created_at).getMonth()
        monthlyData[monthIdx].revenue += Number(i.grand_total) || 0
      }
    })

    exps?.forEach(e => {
      const monthIdx = e.expense_date ? new Date(e.expense_date).getMonth() : new Date().getMonth()
      monthlyData[monthIdx].expenses += Number(e.amount) || 0
    })

    return monthlyData
  }

  async getExpensesByCategory(workspace_id: string): Promise<{ name: string; value: number }[]> {
    const { data, error } = await supabase.from('expenses').select('category, amount').eq('workspace_id', workspace_id)
    if (error) throw error

    const map = new Map<string, number>()
    data.forEach(e => {
      const cat = e.category || 'Autre'
      map.set(cat, (map.get(cat) || 0) + (Number(e.amount) || 0))
    })

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }
}

export const reportRepository = new ReportRepository()
