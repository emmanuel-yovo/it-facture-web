'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Shield, Loader2, Mail, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { canAddUser, PLAN_LIMITS, PlanType } from '@/lib/limits'
import { useRouter } from 'next/navigation'

type Profile = {
  id: string
  full_name: string
  role: string
  workspace_id: string
}

export default function UsersPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, workspaceId, workspacePlan } = useAuthStore()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [isOpen, setIsOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState('user')
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (workspaceId) {
      fetchUsers()
    }
  }, [workspaceId])

  async function fetchUsers() {
    if (!workspaceId) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('full_name')

    if (!error && data) {
      // Filtrer les superadmins pour qu'ils n'apparaissent pas dans la liste
      const filtered = data.filter(p => p.role !== 'superadmin')
      setProfiles(filtered)
    }
    setLoading(false)
  }

  async function handleDelete(userId: string, userName: string) {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userName} ? Cette action est irréversible.`)) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userIdToDelete: userId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression')
      }

      // Refresh list
      fetchUsers()
      alert("Utilisateur supprimé avec succès.")
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsInviting(true)
    setInviteError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          fullName: inviteName,
          role: inviteRole
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation')
      }

      // Success
      setIsOpen(false)
      setInviteEmail('')
      setInvitePassword('')
      setInviteName('')
      setInviteRole('user')
      fetchUsers() // Rafraîchir la liste

    } catch (err: any) {
      setInviteError(err.message)
    } finally {
      setIsInviting(false)
    }
  }

  if (!hasPermission(user?.role, PERMISSIONS.MANAGE_USERS)) {
    return <div className="p-12 text-center text-muted-foreground"><p>Accès restreint aux administrateurs.</p></div>
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="default" className="bg-blue-500">Admin</Badge>
      case 'comptable': return <Badge variant="outline" className="border-purple-500 text-purple-500">Comptable</Badge>
      default: return <Badge variant="secondary">Utilisateur</Badge>
    }
  }

  const plan = (workspacePlan as PlanType) || 'free'
  const maxUsers = PLAN_LIMITS[plan]?.maxUsers || 1
  const currentUsers = profiles.length
  const canAdd = canAddUser(plan, currentUsers, user?.role)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> {t('nav.users', 'Équipe')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('users.subtitle', 'Gérez les membres de votre entreprise et leurs accès.')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-2 rounded-lg flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Membres : <span className={!canAdd && user?.role !== 'superadmin' ? 'text-red-500 font-bold' : 'text-foreground font-bold'}>{currentUsers}</span> / {maxUsers === Infinity ? 'Illimité' : maxUsers}
          </div>
          
          {!canAdd && user?.role !== 'superadmin' ? (
            <Button variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700" onClick={() => router.push('/upgrade')}>
              Augmenter la limite
            </Button>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white">
                  <UserPlus className="w-4 h-4 mr-2" /> {t('users.inviteBtn', 'Inviter un membre')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('users.inviteTitle', 'Inviter un nouveau collaborateur')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4 pt-4">
                  {inviteError && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">{inviteError}</div>}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('clients.fullName', 'Nom complet')}</label>
                    <Input required value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Ex: Jean Dupont" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('clients.email', 'Adresse Email')}</label>
                    <Input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="jean@entreprise.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('users.tempPassword', 'Mot de passe (Provisoire)')}</label>
                    <Input required type="text" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Mot de passe sécurisé..." />
                    <p className="text-xs text-muted-foreground">{t('users.passwordHint', "L'utilisateur pourra le modifier plus tard.")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('users.role', 'Rôle')}</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{t('users.roleUser', 'Utilisateur (Création de factures, Devis)')}</SelectItem>
                        <SelectItem value="comptable">{t('users.roleAccountant', 'Comptable (Consultation globale)')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground pt-1">
                      {t('users.roleWarning', "Note : Vous ne pouvez pas créer d'autres Administrateurs pour des raisons de sécurité.")}
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                      {t('users.sendInvite', "Envoyer l'invitation")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
<table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-3 px-6 font-medium text-muted-foreground">{t('users.nameEmail', 'Nom / Email')}</th>
                  <th className="py-3 px-6 font-medium text-muted-foreground">{t('users.role', 'Rôle')}</th>
                  <th className="py-3 px-6 font-medium text-muted-foreground">{t('invoices.status')}</th>
                  <th className="py-3 px-6 font-medium text-muted-foreground text-right">{t('common.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-medium text-foreground">{p.full_name}</div>
                      <div className="text-xs text-muted-foreground">{t('users.cloudAccount', 'Compte Cloud Supabase')}</div>
                    </td>
                    <td className="py-4 px-6">{getRoleBadge(p.role)}</td>
                    <td className="py-4 px-6"><Badge variant="outline" className="text-emerald-500 border-emerald-500">Actif</Badge></td>
                    <td className="py-4 px-6 text-right">
                      {p.id !== user?.id && (p.role !== 'admin' || user?.role === 'superadmin') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(p.id, p.full_name)}
                          title={t('common.delete', 'Supprimer')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.noData', 'Aucune donnée')}</td></tr>
                )}
              </tbody>
            </table>
</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
