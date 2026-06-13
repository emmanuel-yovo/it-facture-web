require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function test() {
  const workspace_id = "32a27fd3-d4ed-4d2e-a3e7-25b743bbb529" // Emmanuel's workspace
  console.log('Testing dashboard query...')
  
  const [
    invoicesRes,
    expensesRes,
    clientsRes,
    servicesRes,
    itemsRes,
    recentInvoicesRes
  ] = await Promise.all([
    supabase.from('invoices').select('id, grand_total, status, document_type, created_at, client_id, agency_id').eq('workspace_id', workspace_id).eq('document_type', 'invoice'),
    supabase.from('expenses').select('amount, created_at, agency_id').eq('workspace_id', workspace_id),
    supabase.from('clients').select('id, full_name, company_name').eq('workspace_id', workspace_id),
    supabase.from('services').select('id').eq('workspace_id', workspace_id),
    supabase.from('invoice_items').select('service_name, line_total, invoice:invoices!inner(workspace_id, document_type, created_at)').eq('invoice.workspace_id', workspace_id).eq('invoice.document_type', 'invoice'),
    supabase.from('invoices').select('*, client:clients(id, full_name, company_name)').eq('workspace_id', workspace_id).eq('document_type', 'invoice').order('created_at', { ascending: false }).limit(5)
  ])

  console.log('Invoices Error:', invoicesRes.error)
  console.log('Expenses Error:', expensesRes.error)
  console.log('Clients Error:', clientsRes.error)
  console.log('Services Error:', servicesRes.error)
  console.log('Items Error:', itemsRes.error)
  console.log('Recent Invoices Error:', recentInvoicesRes.error)
}

test()
