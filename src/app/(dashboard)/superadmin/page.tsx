'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { superadminRepository } from '@/lib/repositories/superadmin.repository'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { Building, Receipt, Users, ArrowUpRight, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export default function SuperAdminPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'paid' | 'free'>('all')

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return <span className="text-muted-foreground">Inconnu</span>
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffInMinutes < 5) {
      return <span className="flex items-center text-emerald-500 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" /> En ligne</span>
    }
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Il y a ${diffInHours} h`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return `Hier`
    return `Il y a ${diffInDays} jours`
  }

  const loadStats = () => {
    superadminRepository.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!hasPermission(user?.role, PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD)) return
    loadStats()
  }, [user])

  const handlePlanChange = async (workspaceId: string, newPlan: string) => {
    if (!confirm(`Confirmer le passage au plan ${newPlan} ?`)) return
    setUpdating(workspaceId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/superadmin/update-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workspace_id: workspaceId, plan: newPlan })
      })
      const data = await res.json()
      if (data.success) {
        alert("Plan mis à jour avec succès !")
        loadStats()
      } else {
        alert(data.error || "Erreur lors de la mise à jour.")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur réseau.")
    } finally {
      setUpdating(null)
    }
  }

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
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Liste des Entreprises</CardTitle>
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Toutes</Button>
            <Button variant={filter === 'paid' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('paid')}>Abonnés Payants</Button>
            <Button variant={filter === 'free' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('free')}>Comptes Gratuits</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
<table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="py-3 px-4 font-medium text-muted-foreground">Nom de l'entreprise</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Propriétaire</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Dernière Activité</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Plan</th>
                <th className="py-3 px-4 font-medium text-muted-foreground">Expiration Abonnement</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-center">Factures créées</th>
                <th className="py-3 px-4 font-medium text-muted-foreground text-right">CA Total Encaissé</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.workspaces || [])
                .filter((w: any) => filter === 'all' ? true : filter === 'free' ? w.plan === 'free' : w.plan !== 'free')
                .map((w: any) => (
                <tr key={w.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                  <td className="py-3 px-4 font-medium">{w.name}</td>
                  <td className="py-3 px-4">{w.owner?.full_name || 'Inconnu'}</td>
                  <td className="py-3 px-4 text-sm">{formatRelativeTime(w.last_seen_at)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Select 
                        value={w.plan || 'free'} 
                        onValueChange={(val) => handlePlanChange(w.id, val)}
                        disabled={updating === w.id}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                      {updating === w.id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {w.plan !== 'free' ? (
                      w.subscription_end_date ? (
                        <div className="flex flex-col">
                          <span className={`text-sm ${new Date(w.subscription_end_date) < new Date() ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}`}>
                            {new Date(w.subscription_end_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs text-muted-foreground">{w.subscription_interval === 'yearly' ? 'Annuel' : 'Mensuel'}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium text-sm">À vie (Legacy)</span>
                      )
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">{w.invoiceCount}</td>
                  <td className="py-3 px-4 text-right text-emerald-500 font-medium">{formatCurrency(w.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
