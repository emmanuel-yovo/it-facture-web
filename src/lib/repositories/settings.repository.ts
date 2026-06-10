import { supabase } from '../supabase'

export interface AppSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  company_website: string
  tax_id: string
  currency: string
  tax_rate: number
  date_format: string
  invoice_prefix: string
  theme: 'light' | 'dark' | 'system'
  language: string
  default_notes: string
  bank_details: string
  company_country: string
  currency_symbol: string
  company_logo: string
  company_stamp: string
}

export class SettingsRepository {
  async getSettings(workspace_id: string): Promise<Partial<AppSettings>> {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .eq('workspace_id', workspace_id)

    if (error) throw error

    const settings: Partial<AppSettings> = {}
    
    data.forEach(row => {
      if (row.key === 'tax_rate') {
        settings.tax_rate = parseFloat(row.value)
      } else {
        (settings as any)[row.key] = row.value
      }
    })

    return settings
  }

  async saveSettings(workspace_id: string, settings: Partial<AppSettings>): Promise<void> {
    const recordsToUpsert = Object.entries(settings).map(([key, value]) => ({
      workspace_id,
      key,
      value: value?.toString() || ''
    }))

    if (recordsToUpsert.length === 0) return

    const { error } = await supabase
      .from('settings')
      .upsert(recordsToUpsert, { onConflict: 'workspace_id, key' })

    if (error) throw error
  }
}

export const settingsRepository = new SettingsRepository()
