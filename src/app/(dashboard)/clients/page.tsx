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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Users, ChevronLeft, ChevronRight, FileUp, Lock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientRepository, Client } from '@/lib/repositories/client.repository'
import { canCreateClient, PlanType } from '@/lib/limits'
import { useRouter } from 'next/navigation'

const empty = { full_name: '', phone: '', email: '', address: '', company_name: '', country: 'FR', notes: '', is_active: true }

export default function ClientsPage() {
  const { user, workspaceId, workspacePlan } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>(empty)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const result = await clientRepository.getAll({ page, pageSize: 10, search })
      setClients(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }, [page, search, workspaceId])

  useEffect(() => { load() }, [load])

  const handleImport = async () => {
    alert("L'importation de fichiers CSV sera disponible prochainement dans la version Web.")
  }

  const handleSave = async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      if (editing) {
        await clientRepository.update(editing.id, form)
      } else {
        await clientRepository.create(workspaceId, form)
      }
      setModalOpen(false)
      setEditing(null)
      setForm(empty)
      load()
    } catch (error) {
      console.error(error)
      alert("Une erreur est survenue lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await clientRepository.delete(deleteTarget.id)
        setDeleteOpen(false)
        setDeleteTarget(null)
        load()
      } catch (error) {
        console.error(error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({ 
      full_name: c.full_name, 
      phone: c.phone || '', 
      email: c.email || '', 
      address: c.address || '', 
      company_name: c.company_name || '', 
      country: c.country || 'FR', 
      notes: c.notes || '', 
      is_active: c.is_active 
    })
    setModalOpen(true)
  }

  const isLimitReached = !initialLoading && !canCreateClient(plan, total, user?.role)

  const openNew = () => { 
    if (isLimitReached) {
      router.push('/upgrade')
      return
    }
    setEditing(null); setForm(empty); setModalOpen(true) 
  }

  if (initialLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} clients au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <FileUp className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button 
            onClick={openNew}
            className={isLimitReached ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
          >
            {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isLimitReached ? 'Passez à Essential' : 'Nouveau Client'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10 bg-card border-border" />
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nom / Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Entreprise</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Téléphone</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Dépenses</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Factures</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{c.full_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.company_name || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(c.total_spent || 0)}</td>
                    <td className="py-3 px-4 text-center"><Badge variant="secondary">{c.invoice_count || 0}</Badge></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        {['admin', 'superadmin'].includes(user?.role as string) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setDeleteTarget(c); setDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Aucun client trouvé.</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le client" : "Nouveau client"}</DialogTitle>
            <DialogDescription>Remplissez les informations du client</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>Nom complet *</Label><Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Entreprise</Label><Input value={form.company_name || ''} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>Adresse postale</Label><Input value={form.address || ''} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2">
              <Label>Pays du Client</Label>
              <Select value={form.country || 'FR'} onValueChange={(val) => setForm(f => ({ ...f, country: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">France 🇫🇷</SelectItem>
                  <SelectItem value="US">États-Unis (USA) 🇺🇸</SelectItem>
                  <SelectItem value="BJ">Bénin 🇧🇯</SelectItem>
                  <SelectItem value="BF">Burkina Faso 🇧🇫</SelectItem>
                  <SelectItem value="CI">Côte d'Ivoire 🇨🇮</SelectItem>
                  <SelectItem value="GW">Guinée-Bissau 🇬🇼</SelectItem>
                  <SelectItem value="ML">Mali 🇲🇱</SelectItem>
                  <SelectItem value="NE">Niger 🇳🇪</SelectItem>
                  <SelectItem value="SN">Sénégal 🇸🇳</SelectItem>
                  <SelectItem value="TG">Togo 🇹🇬</SelectItem>
                  <SelectItem value="OTHER">Autre pays 🌍</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>Notes internes</Label><Textarea value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.full_name || loading}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le client</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir supprimer ce client ? Cette action archivera le client.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
