'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Clock, Wrench, MoreVertical, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/authStore'
import { ticketRepository, Ticket } from '@/lib/repositories/ticket.repository'
import { clientRepository } from '@/lib/repositories/client.repository'
import { canAccessFeature, PlanType } from '@/lib/limits'
import { Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'

export default function TicketsPage() {
  const { t } = useTranslation()
  const { workspaceId, workspacePlan, user } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'
  const router = useRouter()
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clients, setClients] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    client_id: '',
    subject: '',
    description: '',
    priority: 'medium',
    status: 'open',
    time_spent: 0
  })

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const result = await ticketRepository.getAll({ workspace_id: workspaceId,  
        search, 
        status: statusFilter === 'all' ? undefined : statusFilter 
      })
      setTickets(result.data)
      const cls = await clientRepository.getAll({ workspace_id: workspaceId,  pageSize: 1000 })
      setClients(cls.data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, workspaceId])

  useEffect(() => { load() }, [load])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.client_id || !formData.subject || !workspaceId) return

    setIsSubmitting(true)
    try {
      await ticketRepository.create(workspaceId, {
        ...formData,
        priority: formData.priority as 'low' | 'medium' | 'high',
        status: formData.status as 'open' | 'in_progress' | 'closed' | 'billed'
      })
      setIsCreateModalOpen(false)
      setFormData({ client_id: '', subject: '', description: '', priority: 'medium', status: 'open', time_spent: 0 })
      load()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) return
    try {
      await ticketRepository.delete(id)
      load()
    } catch (error) {
      console.error(error)
    }
  }

  const handleConvertToInvoice = async (id: string) => {
    alert("La conversion en facture sera disponible prochainement.")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t("tickets.openBadge", "Ouvert")}</Badge>
      case 'in_progress': return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t("tickets.inProgress", "En cours")}</Badge>
      case 'closed': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t("tickets.closedBadge", "Fermé")}</Badge>
      case 'billed': return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">{t("tickets.billedBadge", "Facturé")}</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge className="bg-red-500 border-none text-white">{t("tickets.high", "Haute")}</Badge>
      case 'medium': return <Badge className="bg-amber-500 border-none text-white">{t("tickets.medium", "Moyenne")}</Badge>
      case 'low': return <Badge className="bg-slate-500 border-none text-white">{t("tickets.low", "Basse")}</Badge>
      default: return <Badge>{priority}</Badge>
    }
  }

  if (!isLoading && !canAccessFeature(plan, 'tickets', user?.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">{t('upgrade.locked', 'Fonctionnalité Verrouillée')}</h2>
        <p className="text-muted-foreground">
          {t('tickets.lockedMsg', 'La gestion des tickets et interventions techniques est réservée au plan Business et Agence. Gérez vos maintenances et facturez vos interventions facilement.')}
        </p>
        <Button onClick={() => router.push('/upgrade')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
          Passer au plan Business
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.tickets', 'Interventions / Tickets')}</h1>
          <p className="text-muted-foreground mt-1">{t("tickets.subtitle", "Gérez vos interventions techniques et leur facturation.")}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" /> {t('common.add', 'Nouveau')} {t('nav.tickets', 'Ticket').replace('s', '').replace('Maintenance', 'Ticket')}
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('common.search', 'Rechercher...')} className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')}>{t("common.all", "Tous")}</Button>
              <Button variant={statusFilter === 'open' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('open')}>{t("tickets.open", "Ouverts")}</Button>
              <Button variant={statusFilter === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('in_progress')}>{t("tickets.inProgress", "En cours")}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="font-medium">{t('common.noData', 'Aucun ticket trouvé')}</h3>
              <p className="text-sm text-muted-foreground">{t("tickets.noDataDesc", "Commencez par créer votre première intervention de maintenance.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket: any) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow group overflow-hidden border-l-4 border-l-primary">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {ticket.subject}
                        </h4>
                        <p className="text-sm font-medium text-foreground/80">
                          {ticket.client?.full_name} 
                          {ticket.client?.company_name && <span className="text-muted-foreground font-normal"> ({ticket.client.company_name})</span>}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleConvertToInvoice(ticket.id)} className="text-primary font-medium">
                            <ExternalLink className="w-4 h-4 mr-2" /> Convertir en facture
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTicket(ticket.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description || 'Aucune description fournie.'}
                    </p>

                    <div className="pt-3 border-t flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{ticket.time_spent} min</span></div>
                      <span>Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer une intervention</DialogTitle>
            <DialogDescription>Remplissez les détails du ticket technique pour le suivi et la facturation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(val) => setFormData({...formData, client_id: val})}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sujet / Problème *</Label>
              <Input placeholder="ex: Panne réseau..." value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={formData.priority} onValueChange={(val: any) => setFormData({...formData, priority: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Temps estimé (min)</Label>
                <Input type="number" value={formData.time_spent} onChange={(e) => setFormData({...formData, time_spent: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description détaillée</Label>
              <Textarea placeholder="Détails de l'intervention..." className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting || !formData.client_id || !formData.subject}>Enregistrer le ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
