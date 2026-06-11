'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate, getStatusLabel } from '@/lib/utils'
import { Printer, Download, ArrowLeft, CreditCard, CheckCircle, Mail } from 'lucide-react'
import { SignaturePad } from '@/components/SignaturePad'
import { Textarea } from '@/components/ui/textarea'
import { invoiceRepository, Invoice } from '@/lib/repositories/invoice.repository'
import { paymentRepository } from '@/lib/repositories/payment.repository'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { InvoiceTemplate } from '@/components/InvoiceTemplate'
import { pdfService } from '@/lib/services/pdf.service'
import { storageService } from '@/lib/services/storage.service'
import { Copy, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const router = useRouter()
  const { workspaceId, user } = useAuthStore()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<any>({})
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' })
  const [fedaPayLoading, setFedaPayLoading] = useState(false)
  const [paymentLink, setPaymentLink] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)

  const load = async () => {
    if (!id) return
    const inv = await invoiceRepository.getById(id)
    if (!inv) return
    setInvoice(inv)
    
    if (workspaceId) {
      const s = await settingsRepository.getSettings(workspaceId)
      setSettings(s || {})
    }

    setEmailForm({
      to: (inv as any).client?.email || '',
      subject: `${inv.document_type === 'quote' ? 'Devis' : 'Facture'} ${inv.invoice_number}`,
      body: `Bonjour,\n\nVeuillez trouver ci-joint votre ${inv.document_type === 'quote' ? 'devis' : 'facture'} ${inv.invoice_number}.\n\nCordialement.`
    })
  }

  useEffect(() => { load() }, [id])

  if (!invoice) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  const totalPaid = (invoice as any).payments?.reduce((s: number, p: any) => s + p.amount, 0) || 0
  const remaining = invoice.grand_total - totalPaid

  const handlePayment = async () => {
    if (!workspaceId) return
    await paymentRepository.create(workspaceId, { 
      invoice_id: invoice.id, 
      amount: Number(paymentAmount), 
      payment_method: paymentMethod, 
      payment_date: new Date().toISOString(),
    })
    setPaymentOpen(false)
    setPaymentAmount('')
    load()
  }

  const handleSendEmail = async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      // 1. Generate and upload PDF
      const path = await pdfService.uploadPdfFromElement('invoice-pdf-container', workspaceId, invoice.id)
      
      // 2. Get a signed URL for nodemailer to download it
      const pdfUrl = await storageService.getInvoicePdfUrl(path)
      
      // 3. Send via API
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          to: emailForm.to,
          subject: emailForm.subject,
          htmlBody: emailForm.body.replace(/\n/g, '<br/>'),
          pdfUrl: pdfUrl
        })
      })

      const data = await res.json()
      if (data.success) {
        alert("Email envoyé avec succès !")
        setEmailOpen(false)
      } else {
        alert(data.error || "Erreur lors de l'envoi de l'email")
      }
    } catch (e: any) {
      console.error("Détail de l'erreur catch:", e)
      alert(`Erreur technique: ${e.message || "Erreur lors de l'envoi de l'email"}`)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => { window.print() }
  const handleDownload = () => { 
    // Native print dialog is the most robust way to save a perfect PDF
    window.print() 
  }

  const generateFedaPayLink = async () => {
    if (!workspaceId) return
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
          workspace_id: workspaceId
        })
      })
      const data = await res.json()
      if (data.url) {
        setPaymentLink(data.url)
        setLinkDialogOpen(true)
      } else {
        alert(data.error || "Erreur de création du lien FedaPay")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la communication avec FedaPay")
    } finally {
      setFedaPayLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground text-sm">{formatDate(invoice.created_at)}</p>
          </div>
          <Select value={invoice.status} onValueChange={async (val: any) => {
            await invoiceRepository.update(invoice.id, { status: val })
            load()
          }}>
            <SelectTrigger className={`w-36 h-8 text-xs font-semibold ${invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : invoice.status === 'partial' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
            {invoice.document_type === 'quote' ? (
              <>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="unpaid">Non payée</SelectItem>
                <SelectItem value="partial">Partielle</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
              </>
            )}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {invoice.document_type === 'quote' && invoice.status === 'accepted' && (
            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={async () => {
              await invoiceRepository.update(invoice.id, { document_type: 'invoice', status: 'unpaid' })
              load()
            }}>
              Convertir en facture
            </Button>
          )}
          {invoice.document_type === 'invoice' && invoice.status !== 'paid' && (
            <>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setPaymentOpen(true)}><CreditCard className="w-4 h-4 mr-2" />Ajouter un paiement</Button>
              <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={generateFedaPayLink} disabled={fedaPayLoading}>
                <Link2 className="w-4 h-4 mr-2" />
                {fedaPayLoading ? 'Génération...' : 'Lien FedaPay'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setEmailOpen(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" />Imprimer</Button>
          <Button variant="outline" onClick={handleDownload}><Download className="w-4 h-4 mr-2" />PDF</Button>
        </div>
      </div>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Envoyer par email</DialogTitle>
            <DialogDescription>
              Envoyez ce document directement à votre client par email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Destinataire</Label>
              <Input 
                value={emailForm.to} 
                onChange={(e) => setEmailForm({...emailForm, to: e.target.value})}
                placeholder="client@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Objet</Label>
              <Input 
                value={emailForm.subject} 
                onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                rows={5}
                value={emailForm.body} 
                onChange={(e) => setEmailForm({...emailForm, body: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={loading}>
              Envoyer maintenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lien de paiement FedaPay</DialogTitle>
            <DialogDescription>
              Envoyez ce lien sécurisé à votre client. Il pourra payer par Mobile Money ou Carte Bancaire.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Input value={paymentLink} readOnly className="flex-1 font-mono text-xs" />
            <Button size="icon" onClick={() => { navigator.clipboard.writeText(paymentLink); alert("Lien copié !") }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setLinkDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Nom</p><p className="font-medium">{(invoice as any).client?.full_name}</p></div>
                {(invoice as any).client?.company_name && <div><p className="text-xs text-muted-foreground">Entreprise</p><p className="font-medium">{(invoice as any).client?.company_name}</p></div>}
                {(invoice as any).client?.phone && <div><p className="text-xs text-muted-foreground">Tél</p><p>{(invoice as any).client?.phone}</p></div>}
                {(invoice as any).client?.email && <div><p className="text-xs text-muted-foreground">Email</p><p>{(invoice as any).client?.email}</p></div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Services</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Service</th>
                  <th className="text-center py-3 px-4">Qté</th>
                  <th className="text-right py-3 px-4">Prix Unit.</th>
                  <th className="text-right py-3 px-4">Total</th>
                </tr></thead>
                <tbody>
                  {((invoice as any).items || []).map((item: any, i: number) => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-3 px-4">{i + 1}</td>
                      <td className="py-3 px-4"><p className="font-medium">{item.service_name}</p>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="py-3 px-4 text-right font-medium">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {invoice.document_type === 'invoice' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Paiements Reçus</CardTitle></CardHeader>
              <CardContent>
                {((invoice as any).payments || []).length > 0 ? (
                  <div className="space-y-2">
                    {((invoice as any).payments || []).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div><p className="font-medium">{formatCurrency(p.amount)}</p><p className="text-xs text-muted-foreground">{p.payment_method === 'cash' ? 'Espèces' : p.payment_method} — {formatDate(p.payment_date)}</p></div>
                        <Badge variant="success" className="bg-emerald-500 text-white border-none">Reçu</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-center py-6">Aucun paiement enregistré.</p>}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="text-base">Résumé</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total HT</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Taxes (TVA)</span><span>{formatCurrency(invoice.vat_total)}</span></div>
              {invoice.discount_total > 0 && <div className="flex justify-between text-sm text-red-400"><span>Remises</span><span>-{formatCurrency(invoice.discount_total)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total TTC</span><span className="text-primary">{formatCurrency(invoice.grand_total)}</span></div>
              <Separator />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total payé</span><span className="text-emerald-500">{formatCurrency(totalPaid)}</span></div>
              {remaining > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reste à payer</span><span className="text-red-400 font-medium">{formatCurrency(remaining)}</span></div>}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Signature Client</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.signature_data ? (
                <div className="space-y-2">
                  <div className="border rounded-lg p-4 bg-white">
                    <img src={invoice.signature_data} alt="Signature Client" className="max-h-32 mx-auto" />
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium justify-center">
                    <CheckCircle className="w-3 h-3" /> Document signé numériquement
                  </div>
                </div>
              ) : (
                <SignaturePad 
                  onSave={async (data) => {
                    await invoiceRepository.update(invoice.id, { signature_data: data })
                    load()
                  }} 
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un paiement</DialogTitle><DialogDescription>Restant à payer: {formatCurrency(remaining)}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Montant reçu</Label><Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder={String(remaining)} /></div>
            <div className="space-y-2">
              <Label>Moyen de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="transfer">Virement Bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money (Wave, Orange, etc.)</SelectItem>
                  <SelectItem value="card">Carte Bancaire (FedaPay)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Annuler</Button>
            <Button onClick={handlePayment} disabled={!paymentAmount || Number(paymentAmount) <= 0}>Enregistrer le paiement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF Template Container */}
      <div id="invoice-pdf-container">
        <InvoiceTemplate invoice={invoice} settings={settings} />
      </div>
    </motion.div>
  )
}
