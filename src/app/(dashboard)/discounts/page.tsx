'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Percent } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { discountRepository, Discount } from '@/lib/repositories/discount.repository'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useTranslation } from 'react-i18next'

const empty: Partial<Discount> = { name: '', type: 'percentage', value: 0, promo_code: '', is_active: true }

export default function DiscountsPage() {
  const { t } = useTranslation()
  const { workspaceId, user } = useAuthStore()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null)
  const [form, setForm] = useState<Partial<Discount>>(empty)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const r = await discountRepository.getAll({ page: 1, pageSize: 100, search })
      setDiscounts(r.data)
      setTotal(r.total)
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
      if (editing) {
        await discountRepository.update(editing.id, form)
      } else {
        await discountRepository.create(workspaceId, form)
      }
      setModalOpen(false)
      setEditing(null)
      setForm(empty)
      load()
    } catch (err) {
      console.error(err)
      alert(t('common.error', "Erreur lors de la sauvegarde"))
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await discountRepository.delete(deleteTarget.id)
        setDeleteOpen(false)
        setDeleteTarget(null)
        load()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const openEdit = (d: Discount) => {
    setEditing(d)
    setForm({ 
      name: d.name, 
      type: d.type, 
      value: d.value, 
      promo_code: d.promo_code || '', 
      expires_at: d.expires_at ? new Date(d.expires_at).toISOString().substring(0, 10) : undefined, 
      is_active: d.is_active 
    })
    setModalOpen(true)
  }

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  // Protection
  if (!hasPermission(user?.role, PERMISSIONS.MANAGE_DISCOUNTS)) {
    return <div className="p-12 text-center text-muted-foreground"><p>Accès restreint aux administrateurs.</p></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('discounts.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} {t('nav.discounts').toLowerCase()}</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(empty); setModalOpen(true) }}><Plus className="w-4 h-4 mr-2" />{t('discounts.addDiscount', 'Ajouter')}</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('common.search', 'Rechercher...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
<table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('discounts.name')}</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('discounts.type')}</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('discounts.value')}</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('discounts.promoCode')}</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('discounts.expiresAt')}</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('invoices.status', 'Statut')}</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
            </tr></thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{d.name}</td>
                  <td className="py-3 px-4 text-center"><Badge variant="secondary">{d.type === 'percentage' ? t('discounts.percentage', 'Pourcentage (%)') : t('discounts.fixed', 'Montant Fixe')}</Badge></td>
                  <td className="py-3 px-4 text-right font-medium">{d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}</td>
                  <td className="py-3 px-4 text-center font-mono text-xs font-bold text-primary">{d.promo_code || '-'}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{d.expires_at ? formatDate(d.expires_at) : '-'}</td>
                  <td className="py-3 px-4 text-center"><Badge variant={d.is_active ? 'success' : 'outline'}>{d.is_active ? t('common.active') : t('common.inactive')}</Badge></td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => { setDeleteTarget(d); setDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {discounts.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><Percent className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t('discounts.noDiscounts', 'Aucune remise configurée.')}</p></td></tr>}
            </tbody>
          </table>
</div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('discounts.editDiscount') : t('discounts.addDiscount')}</DialogTitle><DialogDescription>Configurez la remise globale ou par code promo</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>{t('discounts.name')} *</Label><Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Soldes d'été" /></div>
            <div className="space-y-2">
              <Label>{t('discounts.type')}</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentage">{t('discounts.percentage')}</SelectItem><SelectItem value="fixed">{t('discounts.fixed')}</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('discounts.value')} *</Label><Input type="number" value={form.value} onChange={(e) => setForm(f => ({ ...f, value: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label>{t('discounts.promoCode')} (Optionnel)</Label><Input value={form.promo_code || ''} onChange={(e) => setForm(f => ({ ...f, promo_code: e.target.value.toUpperCase() }))} placeholder="Ex: ETE2026" /></div>
            <div className="space-y-2"><Label>{t('discounts.expiresAt')}</Label><Input type="date" value={form.expires_at || ''} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
            <div className="col-span-2 flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>{t('discounts.active', 'Remise active')}</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleSave} disabled={!form.name || !form.value}>{t('common.save')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>{t('common.delete')}</DialogTitle><DialogDescription>Cette action est irréversible</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button></DialogFooter></DialogContent>
      </Dialog>
    </motion.div>
  )
}
