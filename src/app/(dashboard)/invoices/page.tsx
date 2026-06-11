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
import { Plus, Search, Eye, Printer, Download, Trash2, FileText, ChevronLeft, ChevronRight, Lock, FileSpreadsheet } from 'lucide-react'
import { invoiceRepository, Invoice } from '@/lib/repositories/invoice.repository'
import { canCreateInvoice, PlanType } from '@/lib/limits'
import { useTranslation } from 'react-i18next'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, workspaceId, workspacePlan } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'
  
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
      const result = await invoiceRepository.getAll({ workspace_id: workspaceId, 
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
        alert(t('common.error', 'Erreur lors de la suppression'))
      }
    }
  }

  const handlePrint = async (id: string) => { router.push(`/invoices/${id}`) }
  const handleDownload = async (id: string) => { router.push(`/invoices/${id}`) }

  const exportToCSV = () => {
    if (invoices.length === 0) return
    const headers = [t('invoices.invoiceNumber', 'Numéro'), t('invoices.client', 'Client'), t('common.date', 'Date'), t('invoices.subtotal', 'Total HT'), t('invoices.vat', 'Total TVA'), t('invoices.total', 'Total TTC'), t('invoices.status', 'Statut')]
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.client?.company_name || inv.client?.full_name || '',
      formatDate(inv.created_at),
      inv.subtotal.toString(),
      inv.vat_total.toString(),
      inv.grand_total.toString(),
      inv.status
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isLimitReached = !loading && !canCreateInvoice(plan, total, user?.role)

  if (loading && invoices.length === 0) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('invoices.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} {t('nav.invoices').toLowerCase()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={exportToCSV} disabled={invoices.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            {t('common.export', 'Exporter CSV')}
          </Button>
          <Button 
            onClick={() => isLimitReached ? router.push('/upgrade') : router.push('/invoices/new')}
            className={isLimitReached ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}
          >
            {isLimitReached ? <Lock className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {isLimitReached ? 'Passez au plan Starter' : t('invoices.newInvoice')}
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('invoices.search', 'Rechercher une facture...')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-10 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} {t('invoices.status').toLowerCase()}</SelectItem>
            <SelectItem value="paid">{t('invoices.paid')}</SelectItem>
            <SelectItem value="unpaid">{t('invoices.unpaid')}</SelectItem>
            <SelectItem value="partial">{t('invoices.partial')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.invoiceNumber')}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client')}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.date')}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('invoices.total')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('invoices.status')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('invoices.actions')}</th>
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
                        {['admin', 'superadmin'].includes(user?.role as string) && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => { setDeleteTarget(inv); setDeleteOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t('invoices.noInvoices')}</p></td></tr>
                )}
              </tbody>
            </table>
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

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{t('invoices.deleteInvoice')}</DialogTitle><DialogDescription>{t('invoices.deleteWarning', 'Cette action supprimera définitivement cette facture.')}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
