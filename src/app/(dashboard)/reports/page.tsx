'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Download, PieChart, Users, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { reportRepository } from '@/lib/repositories/report.repository'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const { workspaceId, user } = useAuthStore()
  const [financialData, setFinancialData] = useState<any[]>([])
  const [topClients, setTopClients] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [financial, clients, categories] = await Promise.all([
        reportRepository.getFinancialSummary(workspaceId),
        reportRepository.getTopClients(workspaceId),
        reportRepository.getExpensesByCategory(workspaceId)
      ])
      setFinancialData(financial)
      setTopClients(clients)
      setExpenseCategories(categories)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [workspaceId])

  const handleExportComptable = async () => {
    alert("L'exportation du pack comptable sera disponible prochainement.")
  }

  if (!hasPermission(user?.role, PERMISSIONS.VIEW_REPORTS)) {
    return <div className="p-12 text-center text-muted-foreground"><p>Accès restreint aux administrateurs.</p></div>
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
          <div className="h-80 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyses Financières</h1>
          <p className="text-muted-foreground mt-1">Suivez la performance et la rentabilité de votre entreprise.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExportComptable} className="bg-primary hover:bg-primary/90 text-white shadow-md">
            <Download className="w-4 h-4 mr-2" /> Pack Comptable
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
              Chiffre d'Affaires <DollarSign className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(financialData.reduce((acc, curr) => acc + curr.revenue, 0))}</div>
            <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />Cumul annuel</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400 flex items-center justify-between">
              Total Dépenses <Briefcase className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{formatCurrency(financialData.reduce((acc, curr) => acc + curr.expenses, 0))}</div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1 flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" />Cumul annuel</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              Bénéfice Net <TrendingUp className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(financialData.reduce((acc, curr) => acc + (curr.revenue - curr.expenses), 0))}</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />Marge estimée</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center justify-between">
              Clients Actifs <Users className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{topClients.length}</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1" />Base de données</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><PieChart className="w-5 h-5 text-primary" /> Performance Mensuelle</CardTitle>
          <CardDescription>Visualisation des flux de revenus et dépenses par mois.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => formatCurrency(value)} />
                <Legend verticalAlign="top" height={36}/>
                <Area name="Revenus" type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area name="Dépenses" type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Top 5 Clients</CardTitle>
            <CardDescription>Basé sur le chiffre d'affaires total généré.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {topClients.slice(0, 5).map((client, i) => (
                <div key={client.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold transition-colors">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.company || 'Particulier'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(client.total_spent)}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{client.invoice_count} Factures</p>
                  </div>
                </div>
              ))}
              {topClients.length === 0 && <p className="text-center text-muted-foreground py-10">Aucune donnée.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><PieChart className="w-5 h-5 text-primary" /> Répartition des Dépenses</CardTitle>
            <CardDescription>Analyse par catégorie de coûts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={expenseCategories} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {expenseCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
