'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Repeat, Calendar, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/store/authStore'
import { subscriptionRepository, Subscription } from '@/lib/repositories/subscription.repository'
import { clientRepository } from '@/lib/repositories/client.repository'
import { useTranslation } from 'react-i18next'

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  const { workspaceId } = useAuthStore()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({ 
    client_id: '', 
    title: '', 
    amount: '', 
    frequency: 'monthly', 
    next_billing_date: new Date().toISOString().split('T')[0],
    is_active: true
  })

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await subscriptionRepository.getAll({ workspace_id: workspaceId,  search })
      setSubscriptions(res.data)
      const cls = await clientRepository.getAll({ workspace_id: workspaceId,  pageSize: 1000 })
      setClients(cls.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, workspaceId])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!workspaceId) return
    try {
      await subscriptionRepository.create(workspaceId, { 
        ...formData, 
        amount: Number(formData.amount) 
      })
      setOpen(false)
      load()
    } catch (err) {
      console.error(err)
      alert(t('subscriptions.errorCreate', "Erreur lors de la création de l'abonnement."))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('subscriptions.deleteConfirm', "Voulez-vous vraiment supprimer cet abonnement ?"))) {
      try {
        await subscriptionRepository.delete(id)
        load()
      } catch (err) {
        console.error(err)
      }
    }
  }

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.subscriptions', 'Abonnements')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('subscriptions.subtitle', 'Gérez vos revenus récurrents')}</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />{t('common.add', 'Nouvel')} {t('nav.subscriptions', 'Abonnement').toLowerCase().replace('s', '')}</Button>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-card" placeholder={t('common.search', 'Rechercher...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Repeat className="w-12 h-12 mb-4 opacity-20" />
              <p>{t('common.noData', 'Aucun abonnement trouvé')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
<table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('subscriptions.titleCol', 'Titre')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('subscriptions.frequencyCol', 'Fréquence')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('subscriptions.nextBillingCol', 'Prochaine Facture')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.status')}</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('payments.amount')}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s: any) => {
                  const isDue = new Date(s.next_billing_date) <= new Date()
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.client?.full_name}</td>
                      <td className="py-3 px-4">{s.title}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.frequency === 'monthly' ? t('subscriptions.monthly', 'Mensuel') : t('subscriptions.yearly', 'Annuel')}</td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center ${isDue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                          <Calendar className="w-3 h-3 mr-1" /> {formatDate(s.next_billing_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={s.is_active ? 'success' : 'outline'}>{s.is_active ? t('common.active') : t('common.inactive')}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(s.amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('common.add', 'Nouvel')} {t('nav.subscriptions', 'Abonnement').toLowerCase().replace('s', '')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={v => setFormData({ ...formData, client_id: v })}>
                <SelectTrigger><SelectValue placeholder={t('subscriptions.selectClient', 'Sélectionner un client')} /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('subscriptions.formTitle', 'Titre (Ex: Hébergement web) *')}</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>{t('subscriptions.amount', 'Montant *')}</Label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>{t('subscriptions.frequencyCol', 'Fréquence')}</Label>
              <Select value={formData.frequency} onValueChange={v => setFormData({ ...formData, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('subscriptions.monthly', 'Mensuel')}</SelectItem>
                  <SelectItem value="yearly">{t('subscriptions.yearly', 'Annuel')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('subscriptions.nextBillingCol', 'Date de prochaine facture')}</Label><Input type="date" value={formData.next_billing_date} onChange={e => setFormData({ ...formData, next_billing_date: e.target.value })} /></div>
            <div className="flex items-center gap-3"><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} /><Label>{t('subscriptions.activeSub', 'Abonnement actif')}</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!formData.client_id || !formData.title || !formData.amount}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
