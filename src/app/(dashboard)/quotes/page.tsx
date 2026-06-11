'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Search, FileText } from 'lucide-react'
import { invoiceRepository, Invoice } from '@/lib/repositories/invoice.repository'
import { useTranslation } from 'react-i18next'

export default function QuotesPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { workspaceId } = useAuthStore()
  const [quotes, setQuotes] = useState<Invoice[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!workspaceId) return
    try {
      const result = await invoiceRepository.getAll({ workspace_id: workspaceId, 
        page: 1, 
        pageSize: 100, 
        search,
        document_type: 'quote'
      })
      setQuotes(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, workspaceId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('nav.quotes')}</h1>
        <Button onClick={() => router.push('/invoices/new?type=quote')}><Plus className="w-4 h-4 mr-2" />{t('common.add', 'Nouveau')} {t('nav.quotes')}</Button>
      </div>

      <Card className="border-border shadow-sm">
        <div className="p-4 border-b border-border/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 bg-card border-border" placeholder={t('common.search', 'Rechercher...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {quotes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('common.noData', 'Aucun devis trouvé')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.invoiceNumber')}</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client')}</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.date')}</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.status')}</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('invoices.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((q: any) => (
                    <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.push(`/invoices/${q.id}`)}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold">{q.invoice_number}</td>
                      <td className="py-3 px-4">{q.client?.full_name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(q.created_at)}</td>
                      <td className="py-3 px-4">
                        <Badge variant={q.status === 'accepted' ? 'success' : q.status === 'rejected' ? 'danger' : 'outline'}>
                          {q.status === 'accepted' ? t('common.yes', 'Accepté') : q.status === 'rejected' ? t('common.no', 'Refusé') : t('common.draft', 'Brouillon')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(q.grand_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
