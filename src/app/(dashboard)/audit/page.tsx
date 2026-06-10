'use client'

import { useState, useEffect } from 'react'
import { Shield, FileText, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useAuthStore } from '@/store/authStore'
import { auditRepository, AuditLog } from '@/lib/repositories/audit.repository'

export default function AuditPage() {
  const { workspaceId, user } = useAuthStore()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filterModule, setFilterModule] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const fetchLogs = async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const result = await auditRepository.getAll({ page, pageSize: 50 })
      setLogs(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [page, workspaceId])

  const getActionBadge = (action: string) => {
    if (action.includes('create')) return <Badge className="bg-emerald-500 border-none text-white">Création</Badge>
    if (action.includes('update')) return <Badge className="bg-blue-500 border-none text-white">Modification</Badge>
    if (action.includes('delete')) return <Badge className="bg-red-500 border-none text-white">Suppression</Badge>
    if (action.includes('login')) return <Badge className="bg-purple-500 border-none text-white">Connexion</Badge>
    return <Badge variant="outline">{action}</Badge>
  }

  const handleExportAudit = async () => {
    alert("L'exportation de l'audit sera disponible prochainement.")
  }

  const filteredLogs = logs.filter(log => {
    const matchesModule = filterModule === 'all' || log.resource_type === filterModule
    const matchesAction = filterAction === 'all' || log.action.includes(filterAction)
    const matchesSearch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesModule && matchesAction && matchesSearch
  })

  // Protection (Admin Only)
  if (!hasPermission(user?.role, PERMISSIONS.VIEW_AUDIT)) {
    return <div className="p-12 text-center text-muted-foreground"><p>Accès restreint aux administrateurs.</p></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> Sécurité & Audit
          </h1>
          <p className="text-muted-foreground mt-1">Journal d'audit et traçabilité des actions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportAudit}>
            <FileText className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle>Journal d'activité</CardTitle>
            <CardDescription>Traçabilité complète des actions effectuées sur le système.</CardDescription>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {total} événements enregistrés
          </Badge>
        </CardHeader>
        <div className="p-4 border-b border-border/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher par utilisateur ou détails..." className="pl-9 h-9 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select className="h-9 px-3 rounded-md border border-border bg-card text-xs outline-none focus:ring-2 focus:ring-primary/20" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
              <option value="all">Tous les modules</option>
              <option value="invoice">Factures</option>
              <option value="client">Clients</option>
              <option value="ticket">Tickets</option>
              <option value="user">Utilisateurs</option>
            </select>
            <select className="h-9 px-3 rounded-md border border-border bg-card text-xs outline-none focus:ring-2 focus:ring-primary/20" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="all">Toutes actions</option>
              <option value="create">Création</option>
              <option value="update">Modification</option>
              <option value="delete">Suppression</option>
              <option value="login">Connexion</option>
            </select>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 italic">Chargement...</TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Aucun résultat.</TableCell></TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="text-sm border-border/50 hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">
                          <User className="w-3 h-3" />
                        </div>
                        {log.user?.full_name || 'Système'}
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="capitalize text-xs font-semibold text-muted-foreground">{log.resource_type}</TableCell>
                    <TableCell className="max-w-md truncate text-xs italic text-muted-foreground">
                      {log.details || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <div className="p-4 flex justify-between items-center border-t border-border/50">
            <p className="text-xs text-muted-foreground">Page {page}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={logs.length < 50} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
