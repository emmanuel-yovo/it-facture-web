'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Building, Upload, Save, Check, LogOut, ShieldCheck, Mail, FileText, Languages, CreditCard, Users, Copy, Trash2, Bell, MessageCircle, Shield } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useAuthStore } from '@/store/authStore'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { supabase } from '@/lib/supabase'
import { storageService } from '@/lib/services/storage.service'
import { useTranslation } from 'react-i18next'
import { RolesManager } from '@/components/settings/RolesManager'

export default function SettingsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user: authUser, workspaceId, logout } = useAuthStore()
  const [settings, setSettings] = useState<any>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [credits, setCredits] = useState<number>(0)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('00000000-0000-0000-0000-000000000004') // user by default
  const [invitePassword, setInvitePassword] = useState('')
  const [availableRoles, setAvailableRoles] = useState<any[]>([])
  const [companyCode, setCompanyCode] = useState<string>('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  
  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const searchParams = useSearchParams()

  const loadRoles = async () => {
    if (!workspaceId) return
    const { data } = await supabase
      .from('roles')
      .select('id, name')
      .or(`workspace_id.eq.${workspaceId},is_system.eq.true`)
      .neq('name', 'superadmin')
      .order('is_system', { ascending: false })
    
    if (data) setAvailableRoles(data)
  }

  useEffect(() => {
    loadRoles()
  }, [workspaceId])

  // Vérification FedaPay ou KkiaPay au retour de la page de paiement
  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade')
    const fedapayId = searchParams.get('id')
    const kkiapayId = searchParams.get('transaction_id')
    const fedapayStatus = searchParams.get('status')
    
    const transactionId = fedapayId || kkiapayId

    if (upgradeStatus === 'success' && transactionId && workspaceId) {
      if (fedapayStatus === 'declined') {
        alert("La transaction a été refusée par la passerelle de paiement. Veuillez réessayer.")
        router.replace('/settings')
        return
      }

      const verifyTransaction = async () => {
        setLoading(true)
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const apiRoute = kkiapayId ? '/api/kkiapay/verify' : '/api/fedapay/verify-transaction'
          
          const res = await fetch(apiRoute, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ transaction_id: transactionId })
          })
          const data = await res.json()
          
          if (data.success) {
            alert(`Paiement réussi ! Votre workspace est maintenant au plan ${data.plan}.`)
            window.location.href = '/settings' // Force reload to fetch new plan
          } else if (data.status === 'declined' || data.status === 'FAILED') {
            alert("La transaction a été refusée par la passerelle de paiement.")
          }
        } catch (e) {
          console.error(e)
        } finally {
          setLoading(false)
        }
      }
      verifyTransaction()
    }
  }, [searchParams, workspaceId, router])

  useEffect(() => {
    if (!workspaceId) return
    const fetchSettings = async () => {
      const s = await settingsRepository.getSettings(workspaceId)
      let finalSettings = { ...s }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/settings/secrets', {
          headers: { 'Authorization': `Bearer ${session?.access_token}` }
        })
        if (res.ok) {
          const secrets = await res.json()
          finalSettings = { ...finalSettings, ...secrets }
        }
      } catch (err) {
        console.error('Erreur chargement secrets:', err)
      }

      // Fetch company_code and credits
      try {
        const { data: wsData } = await supabase.from('workspaces').select('company_code, communication_credits').eq('id', workspaceId).single()
        if (wsData?.company_code) {
          setCompanyCode(wsData.company_code)
        }
        if (wsData?.communication_credits !== undefined) {
          setCredits(wsData.communication_credits)
        }
      } catch (err) {
        console.error('Erreur chargement workspace data:', err)
      }

      setSettings(finalSettings)
      if (finalSettings) {
        localStorage.setItem('company_country', finalSettings.company_country || 'FR')
        localStorage.setItem('currency_symbol', finalSettings.currency_symbol || 'FCFA')
      }
    }
    fetchSettings()
  }, [workspaceId])

  const handleCountryChange = (country: string) => {
    let currency_symbol = '€'
    let tax_rate = '20'
    if (country === 'US') {
      currency_symbol = '$'
      tax_rate = '0'
    } else if (['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'].includes(country)) {
      currency_symbol = 'FCFA'
      tax_rate = '18'
    }
    setSettings((s: any) => ({
      ...s,
      company_country: country,
      currency_symbol,
      tax_rate
    }))
  }

  const handleSave = async () => {
    if (!workspaceId) return
    setLoading(true)
    
    // Sauvegarde des paramètres normaux (les secrets sont exclus dans le repo)
    await settingsRepository.saveSettings(workspaceId, settings)
    
    // Sauvegarde des secrets via l'API sécurisée
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/settings/secrets', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fedapay_secret_key: settings.fedapay_secret_key,
          kkiapay_private_key: settings.kkiapay_private_key,
          kkiapay_secret_key: settings.kkiapay_secret_key,
          smtp_pass: settings.smtp_pass
        })
      })
    } catch (err) {
      console.error('Erreur sauvegarde secrets:', err)
    }

    localStorage.setItem('company_country', settings.company_country || 'FR')
    localStorage.setItem('currency_symbol', settings.currency_symbol || 'FCFA')
    setSaved(true)
    setLoading(false)
    setTimeout(() => {
      setSaved(false)
      window.location.reload()
    }, 1000)
  }

  // Upload Logo to Supabase Storage
  const handleUploadLogo = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (file && workspaceId) {
        setLoading(true)
        try {
          const url = await storageService.uploadLogo(file, workspaceId)
          setSettings((s: any) => ({ ...s, company_logo: url }))
          setSaved(true); setTimeout(() => setSaved(false), 2000)
        } catch (error) {
          console.error(error)
          alert("Erreur lors de l'upload du logo")
        } finally {
          setLoading(false)
        }
      }
    }
    input.click()
  }

  const handleUploadStamp = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (file && workspaceId) {
        setLoading(true)
        try {
          const url = await storageService.uploadLogo(file, workspaceId) // We reuse the public bucket for the stamp
          setSettings((s: any) => ({ ...s, stamp: url }))
          setSaved(true); setTimeout(() => setSaved(false), 2000)
        } catch (error) {
          console.error(error)
          alert("Erreur lors de l'upload du cachet")
        } finally {
          setLoading(false)
        }
      }
    }
    input.click()
  }

  const handleUploadSignature = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (file && workspaceId) {
        setLoading(true)
        try {
          const url = await storageService.uploadLogo(file, workspaceId)
          setSettings((s: any) => ({ ...s, signature: url }))
          setSaved(true); setTimeout(() => setSaved(false), 2000)
        } catch (error) {
          console.error(error)
          alert("Erreur lors de l'upload de la signature")
        } finally {
          setLoading(false)
        }
      }
    }
    input.click()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPwSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 5000)
    } catch (err: any) {
      setPwError(err.message || 'Erreur lors de la modification du mot de passe.')
    } finally {
      setPwLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/users/delete-self', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })

      if (res.ok) {
        await supabase.auth.signOut()
        logout()
        router.push('/register')
      } else {
        const d = await res.json()
        alert(d.error || 'Erreur lors de la suppression.')
      }
    } catch (e) {
      alert("Erreur réseau.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settings.subtitle', 'Configurez votre entreprise et votre application')}</p>
      </div>

      <Tabs defaultValue={['admin', 'superadmin'].includes(authUser?.role as string) ? "company" : "account"} className="space-y-6">
        <TabsList className="bg-card border border-border">
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="company"><Building className="w-4 h-4 mr-2" />{t('settings.companyInfo', 'Entreprise')}</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="team"><Users className="w-4 h-4 mr-2" />Équipe</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="roles"><Shield className="w-4 h-4 mr-2" />Rôles & Accès</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" />{t('settings.emailSettings', 'Emails (SMTP)')}</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-2" />{t('settings.documentsSettings', 'Documents & CGV')}</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_FEDAPAY) && (
            <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-2" />{t('settings.paymentsSettings', 'FedaPay (Paiements)')}</TabsTrigger>
          )}
          {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="reminders"><Bell className="w-4 h-4 mr-2" />Relances Auto</TabsTrigger>
          )}
          <TabsTrigger value="account"><LogOut className="w-4 h-4 mr-2" />{t('settings.account', 'Compte')}</TabsTrigger>
        </TabsList>

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="company">
            <Card className="border border-border shadow-sm">
              <CardHeader><CardTitle>{t('settings.companyInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>{t('settings.companyName')}</Label>
                    <Input value={settings.company_name || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_name: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>{t('settings.companyAddress')}</Label>
                    <Input value={settings.company_address || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.companyPhone')}</Label>
                    <Input value={settings.company_phone || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.companyEmail')}</Label>
                    <Input type="email" value={settings.company_email || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_email: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Pays de l'entreprise (Facturation par défaut)</Label>
                    <Select value={settings.company_country || 'FR'} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="US">États-Unis (USA)</SelectItem>
                        <SelectItem value="BJ">Bénin</SelectItem>
                        <SelectItem value="BF">Burkina Faso</SelectItem>
                        <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                        <SelectItem value="GW">Guinée-Bissau</SelectItem>
                        <SelectItem value="ML">Mali</SelectItem>
                        <SelectItem value="NE">Niger</SelectItem>
                        <SelectItem value="SN">Sénégal</SelectItem>
                        <SelectItem value="TG">Togo</SelectItem>
                        <SelectItem value="OTHER">Autre pays</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('settings.defaultVat')}</Label>
                    <Input type="number" step="0.01" value={settings.tax_rate || ''} onChange={(e) => setSettings((s: any) => ({ ...s, tax_rate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Select value={settings.currency_symbol || 'FCFA'} onValueChange={(val) => setSettings((s: any) => ({ ...s, currency_symbol: val }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez la devise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FCFA">FCFA — Franc CFA (XOF)</SelectItem>
                        <SelectItem value="€">€ — Euro (EUR)</SelectItem>
                        <SelectItem value="$">$ — Dollar US (USD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <Label>Logo de l'entreprise</Label>
                    <div className="flex flex-col gap-4">
                      <div className="h-32 w-full rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/20 overflow-hidden">
                        {settings.company_logo ? (
                          <img src={settings.company_logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-xs text-muted-foreground">Aucun logo configuré</p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleUploadLogo} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer un logo
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Cachet / Tampon Officiel</Label>
                    <div className="flex flex-col gap-4">
                      <div className="h-32 w-full rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/20 overflow-hidden">
                        {settings.stamp ? (
                          <img src={settings.stamp} alt="Cachet" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-center p-4">
                            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-xs text-muted-foreground">Aucun cachet configuré</p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleUploadStamp} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer un cachet
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Signature (Entreprise)</Label>
                    <div className="flex flex-col gap-4">
                      <div className="h-32 w-full rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/20 overflow-hidden">
                        {settings.signature ? (
                          <img src={settings.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-center p-4">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-xs text-muted-foreground">Aucune signature</p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={handleUploadSignature} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer signature
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="min-w-[140px]">
                    {saved ? <><Check className="w-4 h-4 mr-2" />{t('settings.saved')}</> : <><Save className="w-4 h-4 mr-2" />{t('settings.save')}</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="team">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Équipe & Identifiant d'Entreprise</CardTitle>
                <CardDescription>Invitez vos collaborateurs en leur partageant cet identifiant unique.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center text-center space-y-3">
                  <p className="text-sm font-medium text-indigo-900">Identifiant de l'entreprise (Company ID)</p>
                  <div className="flex items-center justify-center gap-3">
                    <code className="text-2xl md:text-3xl font-mono font-bold tracking-widest text-indigo-600 bg-white px-4 py-2 rounded-lg border border-indigo-200 shadow-sm">
                      {companyCode || '------'}
                    </code>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-12 w-12 rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200"
                      onClick={() => {
                        navigator.clipboard.writeText(companyCode)
                        alert("Identifiant copié dans le presse-papier !")
                      }}
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-indigo-700 max-w-md mx-auto">
                    Demandez à vos collaborateurs de s'inscrire puis de choisir "Rejoindre une entreprise" en collant cet identifiant. Ils obtiendront automatiquement le statut "Utilisateur".
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="roles">
            <RolesManager />
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="email">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Configuration Email (SMTP)</CardTitle>
                <CardDescription>Configurez votre serveur pour envoyer les factures par email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Serveur SMTP (ex: smtp.gmail.com)</Label>
                    <Input value={settings.smtp_host || ''} onChange={(e) => setSettings((s: any) => ({ ...s, smtp_host: e.target.value }))} placeholder="smtp.domain.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input type="number" value={settings.smtp_port || ''} onChange={(e) => setSettings((s: any) => ({ ...s, smtp_port: e.target.value }))} placeholder="465 (SSL) ou 587 (TLS)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom d'utilisateur / Email</Label>
                    <Input value={settings.smtp_user || ''} onChange={(e) => setSettings((s: any) => ({ ...s, smtp_user: e.target.value }))} placeholder="votre@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe / Clé d'application</Label>
                    <Input type="password" value={settings.smtp_pass || ''} onChange={(e) => setSettings((s: any) => ({ ...s, smtp_pass: e.target.value }))} placeholder="••••••••••••" />
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border text-sm mt-6">
                  <h4 className="font-semibold mb-2">Guide de configuration rapide</h4>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <strong className="text-foreground">Avec Gmail (Recommandé) :</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Serveur : <code>smtp.gmail.com</code> | Port : <code>465</code></li>
                        <li>Utilisateur : Votre adresse Gmail</li>
                        <li>
                          Mot de passe : <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary hover:underline">Créez un "Mot de passe d'application"</a>.
                          <div className="mt-2 p-3 bg-card border rounded-md text-xs space-y-2">
                            <p className="font-medium text-foreground">Étapes pour créer un mot de passe d'application Gmail :</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Activez la <strong>validation en deux étapes</strong> sur votre compte Google.</li>
                              <li>Allez sur la page <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary hover:underline">Mots de passe d'application</a>.</li>
                              <li>Dans "Sélectionner une application", choisissez <strong>Autre (Nom personnalisé)</strong> et tapez "IT-Facture".</li>
                              <li>Cliquez sur <strong>Générer</strong>.</li>
                              <li>Copiez le mot de passe de 16 lettres (sans espaces) et collez-le ici.</li>
                            </ol>
                            <p className="italic text-amber-600/80 mt-1">ATTENTION : Votre mot de passe de messagerie habituel ne fonctionnera pas par sécurité.</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <strong className="text-foreground">Avec un email Pro (Hostinger, OVH, etc.) :</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Serveur : <code>smtp.hostinger.com</code> ou <code>ssl0.ovh.net</code></li>
                        <li>Port : <code>465</code> (Sécurisé SSL)</li>
                        <li>Utilisateur : Votre email pro</li>
                        <li>Mot de passe : Votre mot de passe habituel</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4">
                  <p className="text-xs text-muted-foreground italic">Note: Les mots de passe sont stockés de manière chiffrée et sécurisée.</p>
                  <Button onClick={handleSave} disabled={loading}>
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="documents">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Design & Conditions de Vente</CardTitle>
                <CardDescription>Personnalisez l'apparence de vos documents PDF et vos mentions légales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Modèle de Design</Label>
                  <Select value={settings.pdf_template || 'classic'} onValueChange={(val) => setSettings((s: any) => ({ ...s, pdf_template: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classique Professionnel</SelectItem>
                      <SelectItem value="modern">Moderne & Épuré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Conditions Générales de Vente (CGV)</Label>
                  <Textarea 
                    rows={10} 
                    placeholder="Saisissez vos CGV ici..." 
                    value={settings.cgv_text || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, cgv_text: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground italic">Ces conditions s'afficheront en bas de chaque facture générée.</p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading}>
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_FEDAPAY) && (
          <TabsContent value="payments">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Configuration FedaPay</CardTitle>
                <CardDescription>Connectez votre compte FedaPay pour accepter les paiements par carte et Mobile Money sur vos factures.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>FedaPay Secret Key (Clé Secrète)</Label>
                  <Input 
                    type="password" 
                    placeholder="sk_live_xxxx ou sk_sandbox_xxxx" 
                    value={settings.fedapay_secret_key || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, fedapay_secret_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Environnement FedaPay</Label>
                  <Select value={settings.fedapay_environment || 'sandbox'} onValueChange={(val) => setSettings((s: any) => ({ ...s, fedapay_environment: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Tests)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator className="my-6" />
                <CardTitle className="text-lg">Configuration KkiaPay</CardTitle>
                <CardDescription>Acceptez les paiements Mobile Money avec KkiaPay.</CardDescription>
                <div className="space-y-2">
                  <Label>KkiaPay Public Key (Clé Publique)</Label>
                  <Input 
                    placeholder="ex: 98acdef06..." 
                    value={settings.kkiapay_public_key || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, kkiapay_public_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>KkiaPay Private Key (Clé Privée)</Label>
                  <Input 
                    type="password" 
                    placeholder="tpk_..." 
                    value={settings.kkiapay_private_key || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, kkiapay_private_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>KkiaPay Secret Key (Clé Secrète)</Label>
                  <Input 
                    type="password" 
                    placeholder="tsk_..." 
                    value={settings.kkiapay_secret_key || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, kkiapay_secret_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Environnement KkiaPay</Label>
                  <Select value={settings.kkiapay_environment || 'sandbox'} onValueChange={(val) => setSettings((s: any) => ({ ...s, kkiapay_environment: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">Sandbox (Tests)</SelectItem>
                      <SelectItem value="live">Live (Production)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={loading}>
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="reminders">
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle>Relances Automatiques</CardTitle>
                <CardDescription>Automatisez vos relances clients par Email et WhatsApp pour réduire les impayés.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-500" /> Crédits de communication</h3>
                    <p className="text-sm text-muted-foreground mt-1">Solde actuel pour l'envoi de messages WhatsApp.</p>
                  </div>
                  <div className="text-2xl font-bold">{credits} <span className="text-sm font-normal text-muted-foreground">crédits</span></div>
                </div>
                
                <div className="space-y-2">
                  <Label>Activer les relances automatiques</Label>
                  <Select value={settings.auto_reminder_enabled || 'false'} onValueChange={(val) => setSettings((s: any) => ({ ...s, auto_reminder_enabled: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui, activer les relances</SelectItem>
                      <SelectItem value="false">Non, désactivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Moment de la relance</Label>
                    <Select value={settings.auto_reminder_days || '1'} onValueChange={(val) => setSettings((s: any) => ({ ...s, auto_reminder_days: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 jours avant échéance (J-3)</SelectItem>
                        <SelectItem value="1">1 jour avant échéance (J-1)</SelectItem>
                        <SelectItem value="0">Le jour de l'échéance (Jour J)</SelectItem>
                        <SelectItem value="-1">1 jour de retard (J+1)</SelectItem>
                        <SelectItem value="-3">3 jours de retard (J+3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Canaux de communication</Label>
                    <Select value={settings.auto_reminder_channels || 'email,whatsapp'} onValueChange={(val) => setSettings((s: any) => ({ ...s, auto_reminder_channels: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email uniquement</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp uniquement</SelectItem>
                        <SelectItem value="email,whatsapp">Email + WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Template du message WhatsApp (Optionnel)</Label>
                  <Textarea 
                    rows={4}
                    placeholder="Bonjour {client}, votre facture {facture} arrive à échéance demain..." 
                    value={settings.auto_reminder_template || ''} 
                    onChange={(e) => setSettings((s: any) => ({ ...s, auto_reminder_template: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Laissez vide pour utiliser le message par défaut. Variables disponibles : {'{client}, {facture}, {montant}, {date}'}</p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} disabled={loading}>
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="account">
          <div className="space-y-6">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-muted-foreground" /> Session utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vous êtes actuellement connecté en tant que <strong>{authUser?.full_name || 'utilisateur'}</strong>. 
                  Toutes vos modifications non enregistrées seront perdues lors de la déconnexion.
                </p>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Se déconnecter de l'application
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" /> Sécurité & Mot de passe
                </CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe pour sécuriser votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  {pwError && <p className="text-sm text-red-500">{pwError}</p>}
                  {pwSuccess && <p className="text-sm text-green-500">Mot de passe mis à jour avec succès !</p>}

                  <Button type="submit" disabled={pwLoading}>
                    {pwLoading ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Zone de danger
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  La suppression de votre compte entraînera la suppression immédiate et définitive de toutes vos données (profil, factures, paramètres de l'entreprise).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer définitivement mon compte
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md border-red-200">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirmation de suppression
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground font-medium">
              Attention ! La suppression de votre compte est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-sm text-muted-foreground">
            <p>
              En tant que propriétaire, cette action détruira définitivement :
            </p>
            <ul className="list-disc list-inside space-y-1 font-medium text-red-600/80">
              <li>L'espace de travail</li>
              <li>Toutes les factures et les devis</li>
              <li>L'ensemble des clients et des services</li>
            </ul>
            <div className="pt-4 space-y-2">
              <Label>Tapez <strong>SUPPRIMER</strong> pour confirmer :</Label>
              <Input 
                value={deleteInput} 
                onChange={(e) => setDeleteInput(e.target.value)} 
                placeholder="SUPPRIMER" 
                className="border-red-200 focus-visible:ring-red-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeleteInput('') }}>Annuler</Button>
            <Button variant="destructive" disabled={deleteInput !== 'SUPPRIMER' || loading} onClick={handleDeleteAccount}>
              {loading ? 'Suppression...' : 'Confirmer la suppression'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
