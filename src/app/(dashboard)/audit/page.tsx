'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Activity, Search, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { auditRepository, AuditLog } from '@/lib/repositories/audit.repository'

export default function AuditPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, workspaceId } = useAuthStore()
  
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Seulement admin et superadmin peuvent voir
  const hasAccess = ['admin', 'superadmin'].includes(user?.role as string)

  const load = useCallback(async () => {
    if (!hasAccess) {
      setLoading(false)
      return
    }
    try {
      // Si superadmin: voit uniquement les logs système (connexions, etc.) => resource_type = 'system'
      // Si admin: voit les logs de l'entreprise => workspace_id = workspaceId
      const result = await auditRepository.getAll({
        page, 
        pageSize: 20, 
        workspace_id: user?.role === 'admin' ? workspaceId || undefined : undefined,
        resource_type: user?.role === 'superadmin' ? 'system' : undefined
      })
      setLogs(result.data)
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, hasAccess, workspaceId, user])

  useEffect(() => { load() }, [load])

  if (!hasAccess) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500/50" />
        <h2 className="text-2xl font-bold">{t("common.accessDenied", "Accès Refusé")}</h2>
        <p className="text-muted-foreground">{t("audit.accessDeniedDesc", "Vous n'avez pas les droits pour voir le journal d'activité.")}</p>
      </div>
    )
  }

  if (loading && logs.length === 0) {
    return <div className="h-96 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  }

  const getActionColor = (action: string) => {
    switch(action?.toUpperCase()) {
      case 'CREATE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'LOGIN': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Journal d'Activité
        </h1>
        <p className="text-muted-foreground text-sm">
          {user?.role === 'superadmin' 
            ? t("audit.subtitleGlobal", "Historique global des actions (Vue SuperAdmin)") 
            : t("audit.subtitleWorkspace", "Historique des actions effectuées sur votre espace de travail.")}
        </p>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-40">{t("audit.dateTime", "Date & Heure")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("audit.user", "Utilisateur")}</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground w-28">{t("audit.action", "Action")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("audit.resource", "Ressource")}</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("audit.details", "Détails")}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-medium">{log.user?.full_name || t("audit.system", "Système")}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground capitalize">{log.resource_type}</td>
                    <td className="py-3 px-4">{log.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      {t("audit.noData", "Aucune activité enregistrée.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">{t("common.page", "Page")} {page} {t("common.of", "sur")} {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
