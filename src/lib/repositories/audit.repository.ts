import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface AuditLog {
  id: string
  workspace_id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  details: string | null
  timestamp: string
  user?: any
}

export class AuditRepository {
  async log(workspace_id: string, data: {
    action: string
    resource_type?: string
    resource_id?: string
    details?: string
  }): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    const user_id = userData?.user?.id

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        workspace_id,
        user_id,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details: data.details,
      })

    if (error) console.error("Erreur Audit Log:", error) // Silencieux car non critique
  }

  async getAll(params: { page?: number; pageSize?: number }): Promise<PaginatedResult<AuditLog>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 20
    const offset = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('audit_logs')
      .select('*, user:profiles(full_name)', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { 
      data: data as any[], 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }
}

export const auditRepository = new AuditRepository()
