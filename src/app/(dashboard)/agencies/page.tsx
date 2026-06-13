'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { agencyRepository, Agency } from '@/lib/repositories/agency.repository'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'

const empty = { name: '', prefix: '', address: '', city: '', is_active: true }

export default function AgenciesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, workspaceId } = useAuthStore()
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Agency | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null)
  const [form, setForm] = useState<Partial<Agency>>(empty)
  const [initialLoading, setInitialLoading] = useState(true)

  // Only admins can access
  const hasAccess = ['admin', 'superadmin'].includes(user?.role as string)

  const load = useCallback(async () => {
    if (!workspaceId) return
    if (!hasAccess) {
      router.push('/')
      return
    }
    try {
      const result = await agencyRepository.getAll(workspaceId)
      setAgencies(result)
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }, [workspaceId, hasAccess, router])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!workspaceId) return
    try {
      if (editing) {
        await agencyRepository.update(editing.id, form)
      } else {
        await agencyRepository.create({ ...form, workspace_id: workspaceId })
      }
      setModalOpen(false)
      setEditing(null)
      setForm(empty)
      load()
    } catch (err) {
      console.error(err)
      alert(t('common.error', "Erreur lors de l'enregistrement de l'agence."))
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await agencyRepository.delete(deleteTarget.id)
        setDeleteOpen(false)
        setDeleteTarget(null)
        load()
      } catch (err) {
        console.error(err)
        alert(t('common.error', "Erreur lors de la suppression."))
      }
    }
  }

  const openEdit = (a: Agency) => {
    setEditing(a)
    setForm({ 
      name: a.name, 
      prefix: a.prefix || '', 
      address: a.address || '', 
      city: a.city || '', 
      is_active: a.is_active 
    })
    setModalOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm(empty)
    setModalOpen(true)
  }

  if (!hasAccess) return null

  if (initialLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agences</h1>
          <p className="text-muted-foreground text-sm mt-1">{agencies.length} agences configurées</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une agence
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Préfixe Facture</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Ville</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Statut</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {agencies.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{a.name}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{a.prefix || '-'}</td>
                    <td className="py-3 px-4 hidden md:table-cell">{a.city || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${a.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {a.is_active ? 'Actif' : 'Inactif'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setDeleteTarget(a); setDeleteOpen(true) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {agencies.length === 0 && (
                  <tr><td colSpan={5} className="py-12 text-center text-muted-foreground"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune agence trouvée.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier l'agence" : "Nouvelle agence"}</DialogTitle><DialogDescription>Gérez les informations de ce point de vente.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>Nom de l'agence *</Label><Input value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Agence de Lomé" /></div>
            <div className="space-y-2"><Label>Préfixe Facture</Label><Input value={form.prefix || ''} onChange={(e) => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} placeholder="Ex: LOM" maxLength={5} /></div>
            <div className="space-y-2"><Label>Ville</Label><Input value={form.city || ''} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Adresse</Label><Input value={form.address || ''} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="col-span-2 flex items-center gap-3 pt-4"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>Actif</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer l'agence</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer cette agence ? Les données liées pourraient être impactées.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
