import { supabase } from '../supabase'
import { PaginatedResult } from './client.repository'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  service_id?: string
  service_name: string
  description?: string
  quantity: number
  unit_price: number
  vat_percentage: number
  discount_id?: string
  discount_value?: number
  line_total?: number
}

export interface Invoice {
  id: string
  workspace_id: string
  invoice_number: string
  client_id: string
  document_type: string
  subtotal: number
  vat_total: number
  discount_total: number
  grand_total: number
  status: string
  notes: string | null
  global_discount_id: string | null
  global_discount_value: number
  signature_data: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  client?: any
  items?: InvoiceItem[]
  payments?: any[]
}

export interface CreateInvoiceData {
  client_id: string
  document_type?: string
  status?: string
  notes?: string
  global_discount_id?: string
  global_discount_value?: number
  due_date?: string
  items: InvoiceItem[]
}

export class InvoiceRepository {
  async getAll(params: { 
    page?: number; 
    pageSize?: number; 
    search?: string; 
    status?: string; 
    client_id?: string; 
    date_from?: string; 
    date_to?: string; 
    document_type?: string 
  }): Promise<PaginatedResult<Invoice>> {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const offset = (page - 1) * pageSize

    let query = supabase
      .from('invoices')
      .select('*, client:clients(id, full_name, company_name, email, phone, address)', { count: 'exact' })

    if (params.search) {
      // Pour chercher à travers la relation client, Supabase le permet si configuré, 
      // ou on peut filtrer par numéro de facture
      query = query.ilike('invoice_number', `%${params.search}%`)
    }
    if (params.status) query = query.eq('status', params.status)
    if (params.client_id) query = query.eq('client_id', params.client_id)
    if (params.date_from) query = query.gte('created_at', params.date_from)
    if (params.date_to) query = query.lte('created_at', params.date_to)
    if (params.document_type) query = query.eq('document_type', params.document_type)

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    return { 
      data: data as Invoice[], 
      total: count || 0, 
      page, 
      pageSize, 
      totalPages: Math.ceil((count || 0) / pageSize) 
    }
  }

  async getById(id: string): Promise<Invoice | undefined> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(*),
        items:invoice_items(*),
        payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return undefined
      throw error
    }

    return data as Invoice
  }

  async create(workspace_id: string, data: CreateInvoiceData): Promise<Invoice> {
    const docType = data.document_type || 'invoice'

    // Récupérer le prochain numéro de facture via RPC
    const { data: invoiceNumber, error: rpcError } = await supabase
      .rpc('get_next_invoice_number', { 
        p_workspace_id: workspace_id, 
        p_doc_type: docType 
      })

    if (rpcError) throw rpcError

    // Calculer les totaux
    let subtotal = 0
    let vatTotal = 0
    let discountTotal = 0

    const itemsToInsert = data.items.map(item => {
      const lineSubtotal = item.unit_price * item.quantity
      const lineDiscount = item.discount_value || 0
      const lineAfterDiscount = lineSubtotal - lineDiscount
      const lineVat = Math.round(lineAfterDiscount * (item.vat_percentage / 100))
      
      subtotal += lineSubtotal
      vatTotal += lineVat
      discountTotal += lineDiscount

      return {
        ...item,
        line_total: lineSubtotal,
        discount_value: lineDiscount
      }
    })

    if (data.global_discount_value && data.global_discount_value > 0) {
      discountTotal += data.global_discount_value
    }

    const grandTotal = subtotal + vatTotal - discountTotal

    // 1. Créer la facture
    const { data: newInvoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        workspace_id,
        invoice_number: invoiceNumber,
        client_id: data.client_id,
        document_type: docType,
        subtotal,
        vat_total: vatTotal,
        discount_total: discountTotal,
        grand_total: grandTotal,
        status: data.status || (docType === 'quote' ? 'draft' : 'unpaid'),
        notes: data.notes,
        global_discount_id: data.global_discount_id,
        global_discount_value: data.global_discount_value || 0,
        due_date: data.due_date,
      })
      .select()
      .single()

    if (invError) throw invError

    // 2. Créer les lignes de facture
    const finalItemsToInsert = itemsToInsert.map(item => ({
      invoice_id: newInvoice.id,
      service_id: item.service_id,
      service_name: item.service_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_percentage: item.vat_percentage,
      discount_id: item.discount_id,
      discount_value: item.discount_value,
      line_total: item.line_total
    }))

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(finalItemsToInsert)

    if (itemsError) throw itemsError

    return this.getById(newInvoice.id) as Promise<Invoice>
  }

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const updateData = { ...data, updated_at: new Date().toISOString() }
    
    // On nettoie les objets imbriqués qui ne font pas partie de la table
    delete updateData.client
    delete updateData.items
    delete updateData.payments

    const { data: updatedInvoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updatedInvoice as Invoice
  }

  async delete(id: string): Promise<void> {
    // Les contraintes ON DELETE CASCADE s'occupent des invoice_items et payments
    // Mais la table tickets n'a pas de contrainte SET NULL. On libère les tickets liés :
    await supabase.from('tickets').update({ invoice_id: null, status: 'closed' }).eq('invoice_id', id)

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const invoiceRepository = new InvoiceRepository()
