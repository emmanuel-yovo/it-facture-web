'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CreditCard, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { paymentRepository, Payment } from '@/lib/repositories/payment.repository'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

export default function PaymentsPage() {
  const { t } = useTranslation()
  const { workspaceId } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const r = await paymentRepository.getAll({ workspace_id: workspaceId,  page, pageSize: 20 })
      setPayments(r.data)
      setTotal(r.total)
      setTotalPages(r.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, workspaceId])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    alert("L'exportation en CSV sera disponible prochainement dans la version Web.")
  }

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('payments.title', 'Paiements Reçus')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} {t('nav.payments').toLowerCase()}</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          {t('common.import', 'Exporter').replace('Import', 'Export')} (CSV)
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.invoiceNumber')}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client')}</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('payments.amount', 'Montant')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('payments.method', 'Méthode')}</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('payments.date', 'Date')}</th>
              </tr></thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold">{p.invoice?.invoice_number || '-'}</td>
                    <td className="py-3 px-4">{p.invoice?.client?.full_name || p.invoice?.client?.company_name || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-500">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="bg-muted">
                        {p.payment_method === 'cash' ? t('payments.cash', 'Espèces') : p.payment_method === 'transfer' ? t('payments.transfer', 'Virement') : p.payment_method === 'check' ? t('payments.check', 'Chèque') : p.payment_method === 'mobile_money' ? t('payments.mobile', 'Mobile Money') : p.payment_method}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{formatDate(p.payment_date)}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>{t('payments.noPayments', 'Aucun paiement trouvé.')}</p></td></tr>}
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
    </motion.div>
  )
}
