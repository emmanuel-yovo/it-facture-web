'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Plus, Search, CheckCircle2, Clock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/authStore'
import { reminderRepository, Reminder } from '@/lib/repositories/reminder.repository'
import { clientRepository } from '@/lib/repositories/client.repository'
import { invoiceRepository } from '@/lib/repositories/invoice.repository'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

export default function RemindersPage() {
  const { t } = useTranslation()
  const { workspaceId } = useAuthStore()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [formData, setFormData] = useState({
    invoice_id: '',
    reminder_type: 'payment',
    notes: '',
    sent_at: new Date().toISOString().split('T')[0]
  })

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const result = await reminderRepository.getAll({ workspace_id: workspaceId,  search })
      setReminders(result.data)
      
      const cls = await clientRepository.getAll({ workspace_id: workspaceId,  pageSize: 1000 })
      setClients(cls.data)
      
      const invs = await invoiceRepository.getAll({ workspace_id: workspaceId,  pageSize: 1000, status: 'unpaid' })
      setInvoices(invs.data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [search, workspaceId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!workspaceId || !formData.invoice_id) return
    try {
      await reminderRepository.create(workspaceId, {
        invoice_id: formData.invoice_id,
        reminder_type: formData.reminder_type,
        notes: formData.notes,
        sent_at: formData.sent_at,
        status: 'pending'
      })
      setIsModalOpen(false)
      load()
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer ce rappel ?")) {
      try {
        await reminderRepository.delete(id)
        load()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const markAsSent = async (id: string) => {
    try {
      await reminderRepository.update(id, { status: 'sent', sent_at: new Date().toISOString() })
      load()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.reminders', 'Relances & Rappels')}</h1>
          <p className="text-muted-foreground mt-1">{t("reminders.subtitle", "Gérez vos rappels de paiement et rendez-vous.")}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> {t('common.add', 'Nouveau')} {t('nav.reminders', 'Rappel').toLowerCase().replace('s', '')}
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t('common.search', 'Rechercher...')} className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-medium">{t('common.noData', 'Aucun rappel')}</h3>
              <p className="text-sm text-muted-foreground">{t("reminders.noDataDesc", "Vous n'avez aucun rappel planifié pour le moment.")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
<table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.date')} {t("common.planned", "Prévue")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("common.type", "Type")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("common.message", "Message")}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('invoices.status')}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-3 px-4 font-medium">
                      {r.sent_at ? format(new Date(r.sent_at), 'dd MMM yyyy', { locale: fr }) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {r.reminder_type === 'payment' && <Badge variant="outline" className="bg-rose-500/10 text-rose-500">{t("reminders.payment", "Paiement")}</Badge>}
                      {r.reminder_type === 'appointment' && <Badge variant="outline" className="bg-blue-500/10 text-blue-500">{t("reminders.appointment", "Rendez-vous")}</Badge>}
                      {r.reminder_type === 'custom' && <Badge variant="outline" className="bg-slate-500/10 text-slate-500">{t("common.other", "Autre")}</Badge>}
                    </td>
                    <td className="py-3 px-4 font-medium">{r.invoice?.client?.full_name || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground truncate max-w-xs">{r.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={r.status === 'sent' ? 'success' : r.status === 'failed' ? 'destructive' : 'secondary'}>
                        {r.status === 'sent' ? t('reminders.sent', 'Envoyé') : r.status === 'failed' ? t('reminders.failed', 'Échoué') : t('reminders.pending', 'En attente')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        {r.status === 'pending' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-500" onClick={() => markAsSent(r.id)} title={t("reminders.markSent", "Marquer comme envoyé")}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("reminders.schedule", "Programmer un rappel")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("reminders.invoiceRef", "Facture concernée *")}</Label>
              <Select value={formData.invoice_id} onValueChange={(val) => setFormData({...formData, invoice_id: val})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {invoices.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.invoice_number} - {i.grand_total} FCFA</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.reminder_type} onValueChange={(val) => setFormData({...formData, reminder_type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">{t("reminders.paymentReminder", "Relance Paiement")}</SelectItem>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="custom">{t("reminders.customMsg", "Message personnalisé")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date d'envoi / prévue *</Label>
              <Input type="date" value={formData.sent_at} onChange={(e) => setFormData({...formData, sent_at: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Message personnalisé / Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Message qui sera envoyé au client..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!formData.invoice_id}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
