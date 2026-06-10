import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Subscription {
  id: string
  workspace_id: string
  client_id: string
  title: string
  amount: number
  frequency: 'monthly' | 'yearly'
  next_billing_date: string | null
  is_active: boolean
  created_at: string
  client?: any
}

export class SubscriptionRepository {
  async getAll(params: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResult<Subscription>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('subscriptions')
      .select('*, client:clients(full_name)', { count: 'exact' })

    if (params.search) {
      query = query.ilike('title', `%${params.search}%`)
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

  async create(workspace_id: string, data: Partial<Subscription>): Promise<Subscription> {
    const { data: newSub, error } = await supabase
      .from('subscriptions')
      .insert({
        workspace_id,
        client_id: data.client_id,
        title: data.title,
        amount: data.amount || 0,
        frequency: data.frequency || 'monthly',
        next_billing_date: data.next_billing_date,
        is_active: data.is_active !== undefined ? data.is_active : true,
      })
      .select()
      .single()

    if (error) throw error
    return newSub as Subscription
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const { data: updatedSub, error } = await supabase
      .from('subscriptions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedSub as Subscription
  }

  async toggleStatus(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const subscriptionRepository = new SubscriptionRepository()
