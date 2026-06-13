import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Expense {
  id: string
  workspace_id: string
  agency_id: string | null
  title: string
  amount: number
  category: string | null
  expense_date: string | null
  notes: string | null
  created_at: string
}

export class ExpenseRepository {
  async getAll(params: { workspace_id?: string; agency_id?: string; page?: number; pageSize?: number; search?: string }): Promise<PaginatedResult<Expense>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('expenses')
      .select('*, agency:agencies(*)', { count: 'exact' })

    if (params.workspace_id) query = query.eq('workspace_id', params.workspace_id);
    if (params.agency_id) query = query.eq('agency_id', params.agency_id);
    if (params.search) {
      query = query.ilike('title', `%${params.search}%`)
    }

    const { data, count, error } = await query
      .order('expense_date', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { 
      data: data as Expense[], 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }

  async create(workspace_id: string, data: Partial<Expense>): Promise<Expense> {
    const { data: newExpense, error } = await supabase
      .from('expenses')
      .insert({
        workspace_id,
        agency_id: data.agency_id,
        title: data.title,
        amount: data.amount || 0,
        category: data.category,
        expense_date: data.expense_date || new Date().toISOString(),
        notes: data.notes,
      })
      .select()
      .single()

    if (error) throw error
    return newExpense as Expense
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const expenseRepository = new ExpenseRepository()
