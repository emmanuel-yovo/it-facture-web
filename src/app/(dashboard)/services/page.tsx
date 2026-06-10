'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Wrench, FileUp } from 'lucide-react'
import { serviceRepository, Service } from '@/lib/repositories/service.repository'
import { settingsRepository } from '@/lib/repositories/settings.repository'

const empty = { name: '', description: '', category: '', unit_price: 0, vat_percentage: 19.25, is_active: true }

export default function ServicesPage() {
  const { user, workspaceId } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [form, setForm] = useState<Partial<Service>>(empty)
  const [defaultVat, setDefaultVat] = useState(19.25)
  const [initialLoading, setInitialLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const result = await serviceRepository.getAll({ page: 1, pageSize: 100, search, category: catFilter || undefined })
      setServices(result.data)
      setTotal(result.total)
      
      const cats = await serviceRepository.getCategories(workspaceId)
      setCategories(cats)
      
      const settings = await settingsRepository.getSettings(workspaceId)
      if (settings.tax_rate !== undefined) setDefaultVat(Number(settings.tax_rate))
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }, [search, catFilter, workspaceId])

  useEffect(() => { load() }, [load])

  const handleImport = async () => {
    alert("L'importation de fichiers CSV sera disponible prochainement dans la version Web.")
  }

  const handleSave = async () => {
    if (!workspaceId) return
    try {
      if (editing) {
        await serviceRepository.update(editing.id, form)
      } else {
        await serviceRepository.create(workspaceId, form)
      }
      setModalOpen(false)
      setEditing(null)
      setForm({ ...empty, vat_percentage: defaultVat })
      load()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'enregistrement du service.")
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await serviceRepository.delete(deleteTarget.id)
        setDeleteOpen(false)
        setDeleteTarget(null)
        load()
      } catch (err) {
        console.error(err)
        alert("Erreur lors de la suppression.")
      }
    }
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({ 
      name: s.name, 
      description: s.description || '', 
      category: s.category, 
      unit_price: s.unit_price, 
      vat_percentage: s.vat_percentage, 
      is_active: s.is_active 
    })
    setModalOpen(true)
  }

  if (initialLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services & Produits</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} services</p>
        </div>
        {['admin', 'superadmin'].includes(user?.role as string) && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport}>
              <FileUp className="w-4 h-4 mr-2" />
              Importer
            </Button>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Service
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un service..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={catFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter('')}>Toutes les catégories</Button>
          {categories.map(cat => (
            <Button key={cat} variant={catFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter(cat)}>{cat}</Button>
          ))}
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nom & Description</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Catégorie</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Prix unitaire</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">TVA</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Statut</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4"><div><p className="font-medium">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">{s.description}</p>}</div></td>
                    <td className="py-3 px-4"><Badge variant="secondary">{s.category}</Badge></td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(s.unit_price)}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{s.vat_percentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${s.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {s.is_active ? 'Actif' : 'Inactif'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {['admin', 'superadmin'].includes(user?.role as string) ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setDeleteTarget(s); setDeleteOpen(true) }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Lecture seule</span>
                      )}
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucun service trouvé.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Modifier le service" : "Nouveau service"}</DialogTitle><DialogDescription>Configurez le service ou produit</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>Nom *</Label><Input value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Description</Label><Textarea value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="space-y-2"><Label>Catégorie</Label><Input value={form.category || ''} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Réseau, Conseil..." /></div>
            <div className="space-y-2"><Label>Prix unitaire ({localStorage.getItem('currency_symbol') || 'FCFA'})</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label>TVA (%)</Label><Input type="number" step="0.01" value={form.vat_percentage} onChange={(e) => setForm(f => ({ ...f, vat_percentage: Number(e.target.value) }))} /></div>
            <div className="flex items-center gap-3 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>Service actif</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.name || form.unit_price === undefined}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer le service</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer ce service ? Il sera archivé et rendu inactif.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button><Button variant="destructive" onClick={handleDelete}>Supprimer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
