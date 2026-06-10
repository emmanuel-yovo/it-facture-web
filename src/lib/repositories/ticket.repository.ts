import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Ticket {
  id: string
  workspace_id: string
  client_id: string
  subject: string
  description: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'closed' | 'billed'
  time_spent: number
  invoice_id: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
  client?: any
}

export class TicketRepository {
  async getAll(params: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<PaginatedResult<Ticket>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('tickets')
      .select('*, client:clients(full_name)', { count: 'exact' })

    if (params.search) {
      query = query.ilike('subject', `%${params.search}%`)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
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

  async create(workspace_id: string, data: Partial<Ticket>): Promise<Ticket> {
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert({
        workspace_id,
        client_id: data.client_id,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'medium',
        status: data.status || 'open',
        time_spent: data.time_spent || 0,
      })
      .select()
      .single()

    if (error) throw error
    return newTicket as Ticket
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const updateData: any = { ...data, updated_at: new Date().toISOString() }
    
    if (data.status === 'closed' || data.status === 'billed') {
      updateData.closed_at = new Date().toISOString()
    } else if (data.status === 'open' || data.status === 'in_progress') {
      updateData.closed_at = null
    }

    const { data: updatedTicket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedTicket as Ticket
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const ticketRepository = new TicketRepository()
