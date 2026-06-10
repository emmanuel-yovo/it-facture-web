'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Plus, Search, Eye, Printer, Download, Trash2, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { invoiceRepository, Invoice } from '@/lib/repositories/invoice.repository'

export default function InvoicesPage() {
  const router = useRouter()
  const { user, workspaceId } = useAuthStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const result = await invoiceRepository.getAll({
        page, 
        pageSize: 10, 
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        document_type: 'invoice'
      })
      setInvoices(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, workspaceId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await invoiceRepository.delete(deleteTarget.id)
        setDeleteOpen(false)
        setDeleteTarget(null)
        load()
      } catch (err) {
        console.error(err)
        alert('Erreur lors de la suppression')
      }
    }
  }

  // Print & Download will be implemented later
  const handlePrint = async (id: string) => { alert("L'impression sera disponible dans la phase finale.") }
  const handleDownload = async (id: string) => { alert("Le téléchargement PDF sera disponible avec le module Puppeteer/Vercel Edge.") }

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} factures</p>
        </div>
        <Button onClick={() => router.push('/invoices/new')}><Plus className="w-4 h-4 mr-2" />Nouvelle Facture</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une facture..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="unpaid">Non payée</SelectItem>
            <SelectItem value="partial">Partielle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Numéro</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Statut</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{inv.invoice_number}</td>
                    <td className="py-3 px-4"><div><p className="font-medium">{inv.client?.full_name}</p>{inv.client?.company_name && <p className="text-xs text-muted-foreground">{inv.client.company_name}</p>}</div></td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(inv.grand_total)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                        {getStatusLabel(inv.status)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/invoices/${inv.id}`)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(inv.id)}><Printer className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(inv.id)}><Download className="w-4 h-4" /></Button>
                        {user?.role === 'admin' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setDeleteTarget(inv); setDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>Aucune facture trouvée.</p></td></tr>
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Supprimer la facture</DialogTitle><DialogDescription>Cette action supprimera définitivement cette facture.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button><Button variant="destructive" onClick={handleDelete}>Supprimer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
