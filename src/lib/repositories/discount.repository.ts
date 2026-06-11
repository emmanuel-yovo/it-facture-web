import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Discount {
  id: string
  workspace_id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  promo_code: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export class DiscountRepository {
  async getAll(params: { workspace_id?: string;  page?: number; pageSize?: number; search?: string }): Promise<PaginatedResult<Discount>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('discounts')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    if (params.workspace_id) query = query.eq('workspace_id', params.workspace_id);
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,promo_code.ilike.%${params.search}%`)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { 
      data: data as Discount[], 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }

  async getById(id: string): Promise<Discount | undefined> {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw error
    }

    return data as Discount
  }

  async getByPromoCode(code: string, workspace_id: string): Promise<Discount | undefined> {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('promo_code', code)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw error
    }

    if (data && data.expires_at && new Date(data.expires_at) < new Date()) {
      return undefined // Expiré
    }

    return data as Discount
  }

  async create(workspace_id: string, data: Partial<Discount>): Promise<Discount> {
    const { data: newDiscount, error } = await supabase
      .from('discounts')
      .insert({
        workspace_id,
        name: data.name,
        type: data.type || 'percentage',
        value: data.value || 0,
        promo_code: data.promo_code,
        expires_at: data.expires_at,
      })
      .select()
      .single()

    if (error) throw error
    return newDiscount as Discount
  }

  async update(id: string, data: Partial<Discount>): Promise<Discount> {
    const { data: updatedDiscount, error } = await supabase
      .from('discounts')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedDiscount as Discount
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('discounts')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}

export const discountRepository = new DiscountRepository()
