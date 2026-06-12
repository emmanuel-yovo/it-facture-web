import { supabase } from '../supabase'

export class SuperadminRepository {
  async getDashboardStats() {
    // We can fetch everything because RLS now allows it for superadmin
    
    // 1. Fetch all workspaces
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false })

    if (workspacesError) throw workspacesError

    // 2. Fetch all profiles to get emails/auth info if needed, but profiles table doesn't have email directly in this schema.
    // However, workspaces gives us the owner info.
    // If we want emails, it's usually in auth.users, which we can't query from client.
    // So we'll just display workspace names and owner names.

    // 3. Fetch global invoice count
    const { count: invoicesCount, error: invoicesError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    if (invoicesError) throw invoicesError

    // 4. Fetch invoices per workspace for stats
    const { data: invoices } = await supabase
      .from('invoices')
      .select('workspace_id, total, status')

    const statsByWorkspace = (workspaces || []).map(w => {
      const workspaceInvoices = (invoices || []).filter(i => i.workspace_id === w.id)
      const totalRevenue = workspaceInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0)
      
      const owner = w.profiles?.find((p: any) => p.role === 'admin') || w.profiles?.[0] || null

      return {
        ...w,
        owner,
        invoiceCount: workspaceInvoices.length,
        totalRevenue
      }
    })

    return {
      totalWorkspaces: workspaces?.length || 0,
      totalInvoices: invoicesCount || 0,
      workspaces: statsByWorkspace
    }
  }
}

export const superadminRepository = new SuperadminRepository()
