'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Papa from 'papaparse'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import { Plus, Search, Pencil, Trash2, Wrench, FileUp, FileSpreadsheet, Building2 } from 'lucide-react'
import { serviceRepository, Service } from '@/lib/repositories/service.repository'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { inventoryRepository, InventoryLevel } from '@/lib/repositories/inventory.repository'
import { agencyRepository, Agency } from '@/lib/repositories/agency.repository'
import { useTranslation } from 'react-i18next'

const empty = { name: '', type: 'service', description: '', category: '', unit_price: 0, vat_percentage: 19.25, is_active: true, track_stock: false, stock_quantity: 0 }

export default function ServicesPage() {
  const { t } = useTranslation()
  const { user, workspaceId } = useAuthStore()
  const [services, setServices] = useState<Service[]>([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [stockTarget, setStockTarget] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([])
  const [form, setForm] = useState<Partial<Service>>(empty)
  const [defaultVat, setDefaultVat] = useState(19.25)
  const [initialLoading, setInitialLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const result = await serviceRepository.getAll({ workspace_id: workspaceId,  page: 1, pageSize: 100, search, category: catFilter || undefined })
      setServices(result.data)
      setTotal(result.total)
      
      const cats = await serviceRepository.getCategories(workspaceId)
      setCategories(cats)
      
      const settings = await settingsRepository.getSettings(workspaceId)
      if (settings.tax_rate !== undefined) setDefaultVat(Number(settings.tax_rate))
      
      const ags = await agencyRepository.getAll(workspaceId)
      setAgencies(ags)
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }, [search, catFilter, workspaceId])

  useEffect(() => { load() }, [load])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    setImportModalOpen(true)
  }

  const exportTemplateCSV = () => {
    const headers = ['Nom', 'Description', 'Catégorie', 'Prix Unitaire', 'TVA', 'Stock']
    const rows = [['Consultation IT', '1h de consultation', 'Service', '50000', '19.25', '0']]
    const csvContent = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'modele_import_services.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !workspaceId) return

    // setLoading(true) // Wait, services page doesn't have a global loading state, let's use a local one
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[]
          let imported = 0
          for (const row of rows) {
            const name = row['Nom'] || row['Name'] || row['Service'] || row['Produit'] || row['name']
            if (!name) continue
            
            await serviceRepository.create(workspaceId, {
              name: name,
              description: row['Description'] || row['description'] || '',
              category: row['Catégorie'] || row['Categorie'] || row['Category'] || row['category'] || 'General',
              unit_price: Number(row['Prix Unitaire'] || row['Prix'] || row['Price'] || row['unit_price'] || 0),
              vat_percentage: Number(row['TVA'] || row['TVA (%)'] || row['VAT'] || row['vat_percentage'] || defaultVat),
              is_active: true,
              track_stock: false,
              stock_quantity: 0
            })
            imported++
          }
          alert(`Succès : ${imported} services importés.`)
          load()
        } catch (err) {
          console.error(err)
          alert("Erreur lors de l'importation.")
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      },
      error: (error) => {
        console.error(error)
        alert("Erreur de lecture du fichier CSV.")
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  const exportToCSV = () => {
    if (services.length === 0) return
    const headers = ['Nom', 'Description', 'Catégorie', 'Prix Unitaire', 'TVA', 'En stock']
    const rows = services.map(s => [
      s.name,
      s.description || '',
      s.category || '',
      s.unit_price,
      s.vat_percentage,
      s.stock_quantity || 0
    ])
    
    const csvContent = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `services_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      alert(t('common.error', "Erreur lors de l'enregistrement du service."))
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
        alert(t('common.error', "Erreur lors de la suppression."))
      }
    }
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({ 
      name: s.name, 
      type: s.type || 'service',
      description: s.description || '', 
      category: s.category, 
      unit_price: s.unit_price, 
      vat_percentage: s.vat_percentage, 
      is_active: s.is_active,
      track_stock: s.track_stock,
      stock_quantity: s.stock_quantity
    })
    setModalOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...empty, vat_percentage: defaultVat })
    setModalOpen(true)
  }

  const openStockModal = async (s: Service) => {
    setStockTarget(s)
    try {
      const levels = await inventoryRepository.getByService(s.id)
      setInventoryLevels(levels)
      setStockModalOpen(true)
    } catch (err) {
      console.error("Failed to load inventory", err)
      alert("Erreur lors du chargement des stocks.")
    }
  }

  const handleStockChange = (agencyId: string, field: 'quantity' | 'unit_price', value: number | null) => {
    setInventoryLevels(prev => {
      const existing = prev.find(l => l.agency_id === agencyId)
      if (existing) {
        return prev.map(l => l.agency_id === agencyId ? { ...l, [field]: value } : l)
      }
      return [...prev, { id: 'new', service_id: stockTarget!.id, agency_id: agencyId, quantity: field === 'quantity' ? value || 0 : 0, unit_price: field === 'unit_price' ? value : null, created_at: '', updated_at: '' }]
    })
  }

  const handleStockSave = async () => {
    if (!stockTarget) return
    try {
      for (const level of inventoryLevels) {
        await inventoryRepository.upsert(level)
      }
      setStockModalOpen(false)
      load() // reload services to get updated stock if it was global, though global stock is separate from agency stock
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la sauvegarde des stocks.")
    }
  }

  if (initialLoading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('services.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} {t('nav.services').toLowerCase()}</p>
        </div>
        {['admin', 'superadmin'].includes(user?.role as string) && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={exportToCSV} disabled={services.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
            <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <Button variant="outline" onClick={handleImportClick}>
              <FileUp className="w-4 h-4 mr-2" />
              {t('common.import', 'Importer CSV')}
            </Button>
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" />
              {t('services.addService')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('services.search', 'Rechercher un service...')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <Button variant={catFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setCatFilter('')}>{t('services.allCategories', 'Toutes les catégories')}</Button>
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
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('services.name')}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">{t('services.category')}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('services.unitPrice')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">{t('services.vatPercentage')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">En stock</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">{t('invoices.status', 'Statut')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4"><div><p className="font-medium">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px] hidden sm:block">{s.description}</p>}</div></td>
                    <td className="py-3 px-4 hidden sm:table-cell"><Badge variant="secondary">{s.category}</Badge></td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(s.unit_price)}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground hidden md:table-cell">{s.vat_percentage}%</td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      {s.track_stock ? (
                        <Badge variant="outline" className={s.stock_quantity <= 0 ? 'border-red-500 text-red-500' : s.stock_quantity <= 5 ? 'border-amber-500 text-amber-500' : 'border-emerald-500 text-emerald-500'}>
                          {s.stock_quantity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${s.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {s.is_active ? t('services.active') : t('services.inactive')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {['admin', 'superadmin'].includes(user?.role as string) ? (
                        <div className="flex items-center justify-center gap-1">
                          {s.type === 'product' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={() => openStockModal(s)} title="Stock & Prix par Agence">
                              <Building2 className="w-4 h-4" />
                            </Button>
                          )}
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
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t('services.noServices')}</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Stock & Prix par Agence</DialogTitle><DialogDescription>Gérez le stock et les prix spécifiques par agence pour {stockTarget?.name}</DialogDescription></DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {agencies.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center">Aucune agence configurée.</p>
            ) : (
              <div className="space-y-4">
                {agencies.map(agency => {
                  const level = inventoryLevels.find(l => l.agency_id === agency.id)
                  return (
                    <div key={agency.id} className="p-3 border rounded-lg bg-muted/20">
                      <h4 className="font-medium mb-3">{agency.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Quantité en stock</Label>
                          <Input 
                            type="number" 
                            min="0"
                            value={level?.quantity || 0} 
                            onChange={(e) => handleStockChange(agency.id, 'quantity', parseInt(e.target.value) || 0)} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Prix spécifique (optionnel)</Label>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder={`Défaut: ${stockTarget?.unit_price}`}
                            value={level?.unit_price ?? ''} 
                            onChange={(e) => handleStockChange(agency.id, 'unit_price', e.target.value ? parseFloat(e.target.value) : null)} 
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleStockSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('services.editService') : t('services.addService')}</DialogTitle><DialogDescription>Configurez le service ou produit</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service (Prestation)</SelectItem>
                  <SelectItem value="product">Produit (Physique)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t('services.name')} *</Label><Input value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="col-span-2 space-y-2"><Label>{t('services.description')}</Label><Textarea value={form.description || ''} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="space-y-2"><Label>{t('services.category')}</Label><Input value={form.category || ''} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex: Réseau, Conseil..." /></div>
            <div className="space-y-2"><Label>{t('services.unitPrice')} ({localStorage.getItem('currency_symbol') || 'FCFA'})</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label>{t('services.vatPercentage')}</Label><Input type="number" step="0.01" value={form.vat_percentage} onChange={(e) => setForm(f => ({ ...f, vat_percentage: Number(e.target.value) }))} /></div>
            <div className="flex items-center gap-3 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} /><Label>{t('services.active')}</Label></div>
            
            {form.type === 'product' && (
              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="font-medium text-sm mb-4 text-muted-foreground">Gestion de Stock (Global)</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.track_stock} onCheckedChange={(v) => setForm(f => ({ ...f, track_stock: v }))} />
                    <Label>Suivre le stock pour ce produit</Label>
                  </div>
                  {form.track_stock && (
                    <div className="space-y-2 max-w-xs">
                      <Label>Quantité en stock global</Label>
                      <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm(f => ({ ...f, stock_quantity: Number(e.target.value) }))} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name || form.unit_price === undefined}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('services.deleteService')}</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer ce service ? Il sera archivé et rendu inactif.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Info Dialog */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importer des Services (CSV)</DialogTitle>
            <DialogDescription>
              Pour que l'importation fonctionne, votre fichier CSV (ou Excel exporté en CSV) doit contenir des colonnes avec des noms spécifiques.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg border text-sm">
              <p className="font-semibold mb-2">Colonnes reconnues :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Nom</strong> (obligatoire)</li>
                <li><strong className="text-foreground">Description</strong></li>
                <li><strong className="text-foreground">Catégorie</strong></li>
                <li><strong className="text-foreground">Prix Unitaire</strong> (nombre)</li>
                <li><strong className="text-foreground">TVA</strong> (ex: 19.25)</li>
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
