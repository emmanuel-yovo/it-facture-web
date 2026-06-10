import { supabase } from '../supabase'

export interface Client {
  id: string
  workspace_id: string
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  company_name: string | null
  notes: string | null
  country: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_spent?: number
  invoice_count?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class ClientRepository {
  async getAll(params: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResult<Client>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('clients')
      .select(`
        *,
        invoices (
          id,
          grand_total
        )
      `, { count: 'exact' })
      .eq('is_active', true)

    if (params.search) {
      query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%,company_name.ilike.%${params.search}%`)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    // Calculer les champs virtuels
    const formattedData = data.map(client => {
      const invoices = client.invoices || []
      const total_spent = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) || 0), 0)
      
      const { invoices: _, ...rest } = client
      return {
        ...rest,
        total_spent,
        invoice_count: invoices.length
      } as Client
    })

    return { 
      data: formattedData, 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }

  async getById(id: string): Promise<Client | undefined> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        invoices (
          id,
          grand_total
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return undefined // Not found
      throw error
    }

    const invoices = data.invoices || []
    const total_spent = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) || 0), 0)
    
    const { invoices: _, ...rest } = data
    return {
      ...rest,
      total_spent,
      invoice_count: invoices.length
    } as Client
  }

  async create(workspace_id: string, data: Partial<Client>): Promise<Client> {
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        workspace_id,
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        company_name: data.company_name,
        notes: data.notes,
        country: data.country || 'FR',
      })
      .select()
      .single()

    if (error) throw error
    return newClient as Client
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const updateData = { ...data, updated_at: new Date().toISOString() }
    
    const { data: updatedClient, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedClient as Client
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from('clients')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  }
}

export const clientRepository = new ClientRepository()
