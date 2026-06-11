import { supabase } from '../supabase'

export interface Reminder {
  id: string
  workspace_id: string
  invoice_id: string
  reminder_type: string | null
  status: 'pending' | 'sent' | 'failed'
  notes: string | null
  sent_at: string | null
}

export class ReminderRepository {
  async getByInvoiceId(invoiceId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sent_at', { ascending: false })

    if (error) throw error
    return data as Reminder[]
  }

  async getAll(params: { workspace_id?: string;  search?: string }): Promise<any> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, invoice:invoices(invoice_number, client:clients(full_name))')
      .order('sent_at', { ascending: false })
    
    if (error) throw error
    return { data }
  }

  async create(workspace_id: string, data: Partial<Reminder>): Promise<Reminder> {
    const { data: newReminder, error } = await supabase
      .from('reminders')
      .insert({
        workspace_id,
        invoice_id: data.invoice_id,
        reminder_type: data.reminder_type,
        status: data.status || 'pending',
        notes: data.notes,
        sent_at: data.sent_at,
      })
      .select()
      .single()

    if (error) throw error
    return newReminder as Reminder
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .update({ status, sent_at: status === 'sent' ? new Date().toISOString() : null })
      .eq('id', id)

    if (error) throw error
  }

  async update(id: string, data: Partial<Reminder>): Promise<void> {
    const { error } = await supabase.from('reminders').update(data).eq('id', id)
    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reminders').delete().eq('id', id)
    if (error) throw error
  }
}

export const reminderRepository = new ReminderRepository()
