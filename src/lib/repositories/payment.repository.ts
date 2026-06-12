import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface Payment {
  id: string
  workspace_id: string
  invoice_id: string
  amount: number
  payment_method: string
  reference: string | null
  notes: string | null
  payment_date: string
  created_at: string
}

export class PaymentRepository {
  async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false })

    if (error) throw error
    return data as Payment[]
  }

  async getAll(params: { workspace_id?: string;  page?: number; pageSize?: number }): Promise<PaginatedResult<Payment>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    const { data, count, error } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices(invoice_number, client:clients(full_name))
      `, { count: 'exact' })
      .order('payment_date', { ascending: false })
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

  async create(workspace_id: string, data: Partial<Payment>): Promise<Payment> {
    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert({
        invoice_id: data.invoice_id,
        amount: data.amount,
        payment_method: data.payment_method || 'virement',
        reference: data.reference,
        notes: data.notes,
        payment_date: data.payment_date || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return newPayment as Payment
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

export const paymentRepository = new PaymentRepository()
