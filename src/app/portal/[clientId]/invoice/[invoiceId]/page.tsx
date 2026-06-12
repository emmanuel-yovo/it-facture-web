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

  // Set the print style to hide everything except the invoice
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice, #printable-invoice * { visibility: visible; }
          #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .no-print { display: none !important; }
        }
      `}} />
      
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

      <main className="py-8 px-4 no-print">
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl rounded-lg overflow-hidden relative">
          <div id="printable-invoice">
            {/* On passe preview={true} pour l'afficher correctement dans la div (au lieu du position absolute top -9999px par défaut) */}
            <InvoiceTemplate invoice={invoice as any} settings={settings} preview={true} />
          </div>
        </div>
      </main>
    </div>
  )
}
