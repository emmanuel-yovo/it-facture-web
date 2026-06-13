import { supabase } from '../supabase'

export interface InventoryLevel {
  id: string
  service_id: string
  agency_id: string
  quantity: number
  unit_price: number | null
  created_at: string
  updated_at: string
  service?: any
  agency?: any
}

export class InventoryRepository {
  async getByService(serviceId: string): Promise<InventoryLevel[]> {
    const { data, error } = await supabase
      .from('inventory_levels')
      .select('*, agency:agencies(name)')
      .eq('service_id', serviceId)
      .order('agency_id')

    if (error) throw error
    return data || []
  }

  async getByAgency(agencyId: string): Promise<InventoryLevel[]> {
    const { data, error } = await supabase
      .from('inventory_levels')
      .select('*, service:services(name, description)')
      .eq('agency_id', agencyId)

    if (error) throw error
    return data || []
  }

  async upsert(level: Partial<InventoryLevel>): Promise<InventoryLevel> {
    const { data, error } = await supabase
      .from('inventory_levels')
      .upsert({
        service_id: level.service_id,
        agency_id: level.agency_id,
        quantity: level.quantity,
        unit_price: level.unit_price
      }, { onConflict: 'service_id,agency_id' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deductStock(serviceId: string, agencyId: string, quantityToDeduct: number): Promise<void> {
    // Ideally this should be an RPC call for concurrency, but for simplicity we do a read+update
    const { data: level } = await supabase
      .from('inventory_levels')
      .select('*')
      .eq('service_id', serviceId)
      .eq('agency_id', agencyId)
      .single()

    if (level) {
      await supabase
        .from('inventory_levels')
        .update({ quantity: level.quantity - quantityToDeduct })
        .eq('id', level.id)
    }
  }
}

export const inventoryRepository = new InventoryRepository()
