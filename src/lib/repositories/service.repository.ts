import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Service {
  id: string
  workspace_id: string
  name: string
  description: string | null
  category: string
  unit_price: number
  vat_percentage: number
  is_active: boolean
  track_stock: boolean
  stock_quantity: number
  created_at: string
  updated_at: string
}

export class ServiceRepository {
  async getAll(params: { workspace_id?: string;  page?: number; pageSize?: number; search?: string; category?: string }): Promise<PaginatedResult<Service>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    if (params.workspace_id) query = query.eq('workspace_id', params.workspace_id);
    if (params.search) {
      query = query.ilike('name', `%${params.search}%`)
    }

    if (params.category) {
      query = query.eq('category', params.category)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { 
      data: data as Service[], 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }

  async getById(id: string): Promise<Service | undefined> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw error
    }

    return data as Service
  }

  async getCategories(workspace_id: string): Promise<string[]> {
    // Dans Supabase, il n'y a pas de SELECT DISTINCT natif simple via l'API REST sans RPC,
    // mais on peut récupérer tous les services et extraire les catégories uniques.
    // S'il y a trop de services, on fera un RPC, mais pour l'instant ceci suffit.
    const { data, error } = await supabase
      .from('services')
      .select('category')
      .eq('workspace_id', workspace_id)
      .eq('is_active', true)

    if (error) throw error

    const uniqueCategories = Array.from(new Set(data.map(item => item.category))).filter(Boolean)
    return uniqueCategories as string[]
  }

  async create(workspace_id: string, data: Partial<Service>): Promise<Service> {
    const { data: newService, error } = await supabase
      .from('services')
      .insert({
        workspace_id,
        name: data.name,
        description: data.description,
        category: data.category || 'General',
        unit_price: data.unit_price || 0,
        vat_percentage: data.vat_percentage || 19.25,
        track_stock: data.track_stock || false,
        stock_quantity: data.stock_quantity || 0,
      })
      .select()
      .single()

    if (error) throw error
    return newService as Service
  }

  async update(id: string, data: Partial<Service>): Promise<Service> {
    const updateData = { ...data, updated_at: new Date().toISOString() }
    
    const { data: updatedService, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedService as Service
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }
}

export const serviceRepository = new ServiceRepository()
