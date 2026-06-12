'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, CreditCard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Invoice } from '@/lib/repositories/invoice.repository'

export function InvoicePortalActions({ invoice, settings }: { invoice: Invoice, settings: any }) {
  const [fedaPayLoading, setFedaPayLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const remaining = invoice.grand_total - ((invoice as any).payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0)

  const generateFedaPayLink = async () => {
    setFedaPayLoading(true)
    try {
      const res = await fetch('/api/fedapay/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoice.id,
          amount: remaining,
          description: `Paiement facture ${invoice.invoice_number}`,
          client_name: (invoice as any).client?.full_name,
          client_email: (invoice as any).client?.email,
          workspace_id: invoice.workspace_id
        })
      })
      const data = await res.json()
      if (data.url) {
        setPaymentLink(data.url)
        setLinkDialogOpen(true)
      } else {
        alert(data.error || "Erreur de création du lien de paiement")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la communication avec FedaPay")
    } finally {
      setFedaPayLoading(false)
    }
  }

  const handleDownload = () => {
    window.print()
  }

  return (
    <>
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleDownload} className="bg-white">
          <Download className="w-4 h-4 mr-2" />
          Télécharger / Imprimer
        </Button>
        
        {invoice.status !== 'paid' && invoice.document_type === 'invoice' && settings.fedapay_public_key && (
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white" 
            onClick={generateFedaPayLink}
            disabled={fedaPayLoading}
          >
            {fedaPayLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Payer en ligne
          </Button>
        )}
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finaliser le paiement</DialogTitle>
            <DialogDescription>
              Vous allez être redirigé vers notre plateforme de paiement sécurisée FedaPay.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => window.open(paymentLink, '_blank')}
            >
              Accéder à la page de paiement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
