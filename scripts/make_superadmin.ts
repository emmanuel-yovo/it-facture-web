import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Should be service role in production, anon key works if RLS allows or if we just want to try

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Promoting user to superadmin...')
  
  // Update all admins to superadmin since this is the creator
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'superadmin' })
    .eq('role', 'admin')
    .select()

  if (error) {
    console.error('Error updating profiles:', error)
  } else {
    console.log('Successfully promoted to superadmin:', data)
  }
}

main()
