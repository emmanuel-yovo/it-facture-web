import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import { InvoiceTemplate } from '@/components/InvoiceTemplate'
import { InvoicePortalActions } from './InvoicePortalActions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Facture - Portail Client',
}

export default async function PortalInvoicePage({ params }: { params: Promise<{ clientId: string, invoiceId: string }> }) {
  const resolvedParams = await params
  const { clientId, invoiceId } = resolvedParams

  if (!clientId || !invoiceId) {
    notFound()
  }

  // 1. Fetch Invoice
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      client:clients(*),
      items:invoice_items(*),
      payments(*)
    `)
    .eq('id', invoiceId)
    .single()

  // Security check: ensure invoice belongs to the client in the URL
  if (invoiceError || !invoice || invoice.client_id !== clientId) {
    notFound()
  }

  // 2. Fetch Workspace Settings
  const { data: settingsData } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .eq('workspace_id', invoice.workspace_id)

  const settings: any = {}
  settingsData?.forEach(row => {
    settings[row.key] = row.value
  })

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* HEADER BAR (No-print) */}
      <div className="no-print bg-slate-900 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/portal/${clientId}`}>
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour au portail
            </Button>
          </Link>
          <InvoicePortalActions invoice={invoice as any} settings={settings} />
        </div>
      </div>

      <main className="py-8 px-4">
        {/* Vue écran (Aperçu) - Masquée à l'impression par .no-print ou le CSS global */}
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-lg overflow-hidden relative no-print">
          <InvoiceTemplate invoice={invoice as any} settings={settings} preview={true} />
        </div>
      </main>

      {/* Conteneur caché pour l'impression (comme dans le Dashboard) */}
      <div id="invoice-pdf-container">
        <InvoiceTemplate invoice={invoice as any} settings={settings} />
      </div>
    </div>
  )
}
