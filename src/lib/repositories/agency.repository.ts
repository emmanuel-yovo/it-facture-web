import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Agency {
  id: string
  workspace_id: string
  name: string
  prefix: string | null
  address: string | null
  city: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export class AgencyRepository {
  async getAll(workspaceId: string): Promise<Agency[]> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getById(id: string): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(agency: Partial<Agency>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .insert(agency)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async update(id: string, updates: Partial<Agency>): Promise<Agency> {
    const { data, error } = await supabase
      .from('agencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('agencies')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const agencyRepository = new AgencyRepository()
