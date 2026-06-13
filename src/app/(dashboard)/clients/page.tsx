'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import useSWR from 'swr'
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
import { Plus, Search, Pencil, Trash2, Users, ChevronLeft, ChevronRight, FileUp, Lock, FileSpreadsheet, Link2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientRepository, Client } from '@/lib/repositories/client.repository'
import { canCreateClient, PlanType } from '@/lib/limits'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

const empty = { full_name: '', phone: '', email: '', address: '', company_name: '', country: 'FR', notes: '', is_active: true }

export default function ClientsPage() {
  const { t } = useTranslation()
  const { user, workspaceId, workspacePlan } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'
  const router = useRouter()
  
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>(empty)
  const [loading, setLoading] = useState(false)

  const { data: fetchResult, isLoading: initialLoading, mutate: load } = useSWR(
    workspaceId ? ['clients', workspaceId, page, search] : null,
    async () => {
      return await clientRepository.getAll({ workspace_id: workspaceId!, page, pageSize: 10, search })
    },
    { keepPreviousData: true }
  )

  const clients = fetchResult?.data || []
  const total = fetchResult?.total || 0
  const totalPages = fetchResult?.totalPages || 1

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const exportTemplateCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Adresse']
    const rows = [['Jean Dupont', 'jean@exemple.com', '0600000000', 'Acme Corp', '123 Rue de la Paix']]
    const csvContent = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modele_import_clients.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyPortalLink = (clientId: string) => {
    const link = `${window.location.origin}/portal/${clientId}`
    navigator.clipboard.writeText(link)
    alert("Lien du portail client copié dans le presse-papier !")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !workspaceId) return

    setLoading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[]
          let imported = 0
          for (const row of rows) {
            const fullName = row['Nom'] || row['Nom complet'] || row['Full Name'] || row['Name'] || row['Client'] || row['full_name']
            if (!fullName) continue
            
            await clientRepository.create(workspaceId, {
              full_name: fullName,
              email: row['Email'] || row['E-mail'] || row['Courriel'] || row['email'] || '',
              phone: row['Téléphone'] || row['Telephone'] || row['Phone'] || row['Tel'] || row['phone'] || '',
              company_name: row['Entreprise'] || row['Société'] || row['Company'] || row['company_name'] || '',
              address: row['Adresse'] || row['Address'] || row['address'] || '',
              country: 'FR',
              is_active: true
            })
            imported++
          }
          alert(`Succès : ${imported} clients importés.`)
          load()
        } catch (err) {
          console.error(err)
          alert("Erreur lors de l'importation.")
        } finally {
          setLoading(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (error) => {
        console.error(error)
        alert("Erreur de lecture du fichier CSV.")
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const exportToCSV = () => {
    if (clients.length === 0) return
    const headers = ['Nom', 'Entreprise', 'Téléphone', 'Email', 'Adresse', 'Pays', 'Total Depense', 'Nombre Factures']
    const rows = clients.map(c => [
      c.full_name,
      c.company_name || '',
      c.phone || '',
      c.email || '',
      c.address || '',
      c.country || '',
      c.total_spent || 0,
      c.invoice_count || 0
    ])
    
    const csvContent = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      alert(t('common.error', "Une erreur est survenue lors de l'enregistrement."))
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
        alert(t('common.error', 'Erreur lors de la suppression'))
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} {t('nav.clients').toLowerCase()}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToCSV} disabled={clients.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          <Button variant="outline" onClick={handleImportClick} disabled={loading}>
            <FileUp className="w-4 h-4 mr-2" />
            {loading ? 'Importation...' : t('common.import', 'Importer CSV')}
          </Button>
          <Button 
            onClick={openNew}
            className={isLimitReached ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
          >
            {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isLimitReached ? 'Passez au plan Starter' : t('clients.addClient')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('clients.search', 'Rechercher un client...')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10 bg-card border-border" />
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {/* VUE DESKTOP (Tableau) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('clients.fullName')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{t('clients.company')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">{t('clients.phone')}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">{t('clients.email')}</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('clients.totalSpent')}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">{t('clients.invoiceCount')}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium">{c.full_name}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell">{c.company_name || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">{c.phone || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(c.total_spent || 0)}</td>
                    <td className="py-3 px-4 text-center hidden md:table-cell"><Badge variant="secondary">{c.invoice_count || 0}</Badge></td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" onClick={() => copyPortalLink(c.id)} title="Copier le lien du portail client"><Link2 className="w-4 h-4 text-indigo-500" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        {['admin', 'superadmin'].includes(user?.role as string) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => { setDeleteTarget(c); setDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>{t('clients.noClients')}</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* VUE MOBILE (Cartes) */}
          <div className="md:hidden flex flex-col gap-3 p-4 bg-muted/10">
            {clients.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Card className="p-4 border border-border/50 shadow-sm hover:shadow-md transition-shadow bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-base line-clamp-1">{c.full_name}</p>
                      {c.company_name && <p className="text-xs text-muted-foreground mt-0.5">{c.company_name}</p>}
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">{c.invoice_count || 0} fact.</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm py-3 my-2 border-y border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('clients.phone')}</span>
                      <span className="truncate">{c.phone || '-'}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('clients.totalSpent')}</span>
                      <span className="font-bold text-primary">{formatCurrency(c.total_spent || 0)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-8 rounded-full" onClick={() => copyPortalLink(c.id)} title="Lien Portail"><Link2 className="w-3.5 h-3.5 mr-1" /> Portail</Button>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      {['admin', 'superadmin'].includes(user?.role as string) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50" onClick={() => { setDeleteTarget(c); setDeleteOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {clients.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('clients.noClients')}</p>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{t('common.page')} {page} {t('common.of')} {totalPages}</p>
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
            <DialogTitle>{editing ? t('clients.editClient') : t('clients.addClient')}</DialogTitle>
            <DialogDescription>{t('clients.fillInfo', 'Remplissez les informations du client')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>{t('clients.fullName')} *</Label><Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>{t('clients.phone')}</Label><Input value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div className="space-y-2"><Label>{t('clients.email')}</Label><Input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>{t('clients.company')}</Label><Input value={form.company_name || ''} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>{t('clients.address')}</Label><Input value={form.address || ''} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2">
              <Label>Pays du Client</Label>
              <Select value={form.country || 'FR'} onValueChange={(val) => setForm(f => ({ ...f, country: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez le pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="US">États-Unis (USA)</SelectItem>
                  <SelectItem value="BJ">Bénin</SelectItem>
                  <SelectItem value="BF">Burkina Faso</SelectItem>
                  <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                  <SelectItem value="GW">Guinée-Bissau</SelectItem>
                  <SelectItem value="ML">Mali</SelectItem>
                  <SelectItem value="NE">Niger</SelectItem>
                  <SelectItem value="SN">Sénégal</SelectItem>
                  <SelectItem value="TG">Togo</SelectItem>
                  <SelectItem value="OTHER">Autre pays</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>{t('clients.notes')}</Label><Textarea value={form.notes || ''} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.full_name || loading}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('clients.deleteClient')}</DialogTitle>
            <DialogDescription>{t('clients.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Info Dialog */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des Clients (CSV)</DialogTitle>
            <DialogDescription>
              Pour que l'importation fonctionne, votre fichier CSV (ou Excel exporté en CSV) doit contenir des colonnes avec des noms spécifiques.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg border text-sm">
              <p className="font-semibold mb-2">Colonnes reconnues :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Nom</strong> (obligatoire)</li>
                <li><strong className="text-foreground">Email</strong></li>
                <li><strong className="text-foreground">Téléphone</strong></li>
                <li><strong className="text-foreground">Entreprise</strong></li>
                <li><strong className="text-foreground">Adresse</strong></li>
              </ul>
            </div>
            <Button variant="outline" className="w-full" onClick={exportTemplateCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Télécharger un modèle CSV
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { setImportModalOpen(false); fileInputRef.current?.click() }}>
              Sélectionner le fichier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
