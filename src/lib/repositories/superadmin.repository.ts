import { supabase } from '../supabase'

export class SuperadminRepository {
  async getDashboardStats() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("No session found")

    const res = await fetch('/api/superadmin/stats', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    const json = await res.json()
    if (!json.success) throw new Error(json.error || "Failed to fetch stats")
      
    return json.data
  }
}

export const superadminRepository = new SuperadminRepository()
