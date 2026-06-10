'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { superadminRepository } from '@/lib/repositories/superadmin.repository'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { Building, Receipt, Users, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export default function SuperAdminPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasPermission(user?.role, PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD)) return
    
    superadminRepository.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (!hasPermission(user?.role, PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD)) {
    return <div className="p-12 text-center text-red-500">Accès refusé. Réservé au SuperAdmin.</div>
  }

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration Globale</h1>
        <p className="text-muted-foreground text-sm mt-1">Vue globale de toutes les entreprises utilisant IT-Facture.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Building className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Entreprises Inscrites</p>
              <h2 className="text-2xl font-bold">{stats?.totalWorkspaces}</h2>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500"><Receipt className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Factures Générées</p>
              <h2 className="text-2xl font-bold">{stats?.totalInvoices}</h2>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Plan Dominant</p>
              <h2 className="text-2xl font-bold">Free</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Entreprises</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 font-medium text-muted-foreground">Nom de l'entreprise</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Propriétaire</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Plan</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">Factures créées</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">CA Total Encaissé</th>
              </tr>
            </thead>
            <tbody>
              {stats?.workspaces.map((w: any) => (
                <tr key={w.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-medium">{w.name}</td>
                  <td className="py-3 px-4">{w.owner?.full_name || 'Inconnu'}</td>
                  <td className="py-3 px-4"><Badge variant="outline">{w.plan}</Badge></td>
                  <td className="py-3 px-4 text-center">{w.invoiceCount}</td>
                  <td className="py-3 px-4 text-right text-emerald-500 font-medium">{formatCurrency(w.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </motion.div>
  )
}
