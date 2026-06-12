'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { DollarSign, FileText, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Receipt, Minus, CheckCircle2, Circle } from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { dashboardRepository, DashboardStats } from '@/lib/repositories/dashboard.repository'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

export default function DashboardPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { workspaceId } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this_month')

  useEffect(() => {
    if (!workspaceId) return
    setLoading(true)
    
    let start: Date | undefined
    let end: Date | undefined
    const now = new Date()
    
    switch (period) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = now
        break
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      case 'this_quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
        start = new Date(now.getFullYear(), quarterStartMonth, 1)
        end = now
        break
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      case 'all_time':
        start = new Date(2000, 0, 1)
        end = now
        break
    }
    
    Promise.all([
      dashboardRepository.getStats(workspaceId, start?.toISOString(), end?.toISOString()),
      settingsRepository.getSettings(workspaceId)
    ]).then(([statsData, settingsData]) => {
      setStats(statsData)
      setSettings(settingsData)
      setLoading(false)
    }).catch(console.error)
  }, [workspaceId, period])

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-32 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    )
  }

  const statCards = [
    { label: t('dashboard.totalRevenue', 'Revenus (Encaissés)'), value: formatCurrency(stats.total_revenue), icon: DollarSign, color: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/20', trend: stats.trends?.revenue },
    { label: t('nav.expenses', 'Dépenses'), value: formatCurrency(stats.total_expenses), icon: Receipt, color: 'from-red-500 to-pink-500', shadow: 'shadow-red-500/20', trend: stats.trends?.expenses },
    { label: t('dashboard.netProfit', 'Bénéfice Net'), value: formatCurrency(stats.net_profit), icon: TrendingUp, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20', trend: stats.trends?.profit },
    { label: t('dashboard.totalInvoices', 'Factures Émises'), value: String(stats.total_invoices), icon: FileText, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', sub: `${stats.paid_invoices} ${t('invoices.paid', 'payées').toLowerCase()}`, trend: stats.trends?.invoices },
    { label: t('dashboard.activeClients', 'Clients Actifs'), value: String(stats.active_clients), icon: Users, color: 'from-indigo-400 to-cyan-400', shadow: 'shadow-indigo-400/20', sub: `/ ${stats.total_clients} total` },
  ]

  const invoiceStatusData = [
    { name: t('invoices.paid', 'Payées'), value: stats.paid_invoices },
    { name: t('invoices.partial', 'Partielles'), value: stats.partial_invoices },
    { name: t('invoices.unpaid', 'Impayées'), value: stats.unpaid_invoices }
  ].filter(d => d.value > 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold">{t('dashboard.title', 'Tableau de bord')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard.subtitle', "Vue d'ensemble de votre activité financière")}</p>
        </motion.div>
        
        <motion.div variants={item} className="w-full sm:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">Ce mois-ci</SelectItem>
              <SelectItem value="last_month">Mois précédent</SelectItem>
              <SelectItem value="this_quarter">Ce trimestre</SelectItem>
              <SelectItem value="this_year">Cette année</SelectItem>
              <SelectItem value="all_time">Depuis toujours</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Onboarding Checklist for new users */}
      {stats.total_invoices === 0 && period === 'this_month' && (
        <motion.div variants={item}>
          <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2">Bienvenue sur IT-Facture !</h2>
              <p className="text-sm text-muted-foreground mb-4">Voici les étapes pour créer votre première facture et bien démarrer :</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium line-through opacity-70">Créer votre compte</span>
                </div>
                <div className="flex items-center gap-3">
                  {settings?.company_name && settings?.company_address ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${settings?.company_name && settings?.company_address ? 'line-through opacity-70' : ''}`}>
                    Compléter les informations de votre entreprise dans les <strong><a href="/settings" className="text-primary hover:underline">Paramètres</a></strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.total_services > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${stats.total_services > 0 ? 'line-through opacity-70' : ''}`}>
                    Créer votre premier <strong><a href="/services" className="text-primary hover:underline">Produit / Service</a></strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.total_clients > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${stats.total_clients > 0 ? 'line-through opacity-70' : ''}`}>
                    Ajouter votre premier <strong><a href="/clients" className="text-primary hover:underline">Client</a></strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.total_invoices > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className={`text-sm ${stats.total_invoices > 0 ? 'line-through opacity-70' : ''}`}>
                    Créer et envoyer votre première <strong><a href="/invoices/new" className="text-primary hover:underline">Facture</a></strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
            <Card className="relative overflow-hidden border border-border bg-card shadow-sm h-full">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                    {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
                    
                    {card.trend !== undefined && period !== 'all_time' && (
                      <div className="flex items-center gap-1 mt-2">
                        {card.trend > 0 ? (
                          <span className="flex items-center text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm"><ArrowUpRight className="w-3 h-3 mr-0.5" /> +{card.trend}%</span>
                        ) : card.trend < 0 ? (
                          <span className="flex items-center text-[11px] font-medium text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded-sm"><ArrowDownRight className="w-3 h-3 mr-0.5" /> {card.trend}%</span>
                        ) : (
                          <span className="flex items-center text-[11px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-sm"><Minus className="w-3 h-3 mr-0.5" /> 0%</span>
                        )}
                        <span className="text-[10px] text-muted-foreground opacity-70 truncate max-w-[80px]" title="vs période préc.">vs. préc.</span>
                      </div>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shrink-0 ${card.shadow}`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${card.color}`} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border border-border shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.revenueChart', 'Évolution des Revenus')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthly_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      labelStyle={{ color: 'var(--foreground)' }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), t('nav.invoices', 'Revenus')]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t('dashboard.topServices', 'Top Services / Produits')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.top_services.map((svc, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.count} {t('common.active', 'utilisations').toLowerCase()}</p>
                    </div>
                    <p className="text-sm font-bold text-right">{formatCurrency(svc.revenue)}</p>
                  </div>
                ))}
                {stats.top_services.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">{t('common.noData', 'Aucune donnée')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <Card className="h-full border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Répartition des Créances</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-[250px]">
              {invoiceStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {invoiceStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} factures`, '']} 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <PieChart className="w-12 h-12 opacity-20 mb-2" />
                  <p className="text-sm">Aucune facture sur cette période</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('dashboard.recentInvoices', 'Factures Récentes')}</CardTitle>
              <button onClick={() => router.push('/invoices')} className="text-sm text-primary hover:underline flex items-center gap-1">
                {t('common.all', 'Voir tout')} <ArrowUpRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.invoiceNumber', 'Numéro')}</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.client', 'Client')}</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t('invoices.date', 'Date')}</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">{t('invoices.total', 'Montant')}</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">{t('invoices.status', 'Statut')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_invoices.map((inv: any) => (
                      <tr
                        key={inv.id}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                      >
                        <td className="py-3 px-4 font-mono text-xs">{inv.invoice_number}</td>
                        <td className="py-3 px-4 font-medium">{inv.client?.full_name || inv.client?.company_name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(inv.grand_total)}</td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}>
                            {getStatusLabel(inv.status)}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stats.recent_invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          {t('invoices.noInvoices', 'Aucune facture récente')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
