'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Receipt, Download, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { expenseRepository, Expense } from '@/lib/repositories/expense.repository'
import { canAccessFeature, PlanType } from '@/lib/limits'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExpensesPage() {
  const { workspaceId, workspacePlan } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'
  const router = useRouter()
  
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({ title: '', amount: '', category: '', expense_date: new Date().toISOString().split('T')[0], notes: '' })

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await expenseRepository.getAll({ search })
      setExpenses(res.data)
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
      await expenseRepository.create(workspaceId, { ...formData, amount: Number(formData.amount) })
      setOpen(false)
      load()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la création de la dépense.")
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      try {
        await expenseRepository.delete(id)
        load()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const exportCSV = async () => {
    alert("L'exportation CSV des dépenses sera disponible dans une prochaine mise à jour Web.")
  }

  if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  if (!canAccessFeature(plan, 'expenses', user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Fonctionnalité Verrouillée</h2>
        <p className="text-muted-foreground">
          La gestion des dépenses est disponible à partir du plan Pro. Suivez vos sorties d'argent, classez-les par catégories et préparez votre comptabilité facilement.
        </p>
        <Button onClick={() => router.push('/upgrade')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          Passer à la version Pro
        </Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dépenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Suivez vos sorties d'argent</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Exporter</Button>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle Dépense</Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-card" placeholder="Rechercher une dépense..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Receipt className="w-12 h-12 mb-4 opacity-20" />
              <p>Aucune dépense trouvée</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Titre</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Catégorie</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Montant</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{e.expense_date ? formatDate(e.expense_date) : '-'}</td>
                    <td className="py-3 px-4 font-medium">{e.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.category || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-red-400">{formatCurrency(e.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle Dépense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Titre *</Label><Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Montant *</Label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div className="space-y-2"><Label>Catégorie</Label><Input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ex: Matériel, Licences..." /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={formData.expense_date} onChange={e => setFormData({ ...formData, expense_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.amount}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
