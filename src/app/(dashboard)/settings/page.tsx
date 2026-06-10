'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Building, Upload, Save, Check, LogOut, ShieldCheck, Mail, FileText, Languages, CreditCard } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { useAuthStore } from '@/store/authStore'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { supabase } from '@/lib/supabase'
import { storageService } from '@/lib/services/storage.service'

export default function SettingsPage() {
  const router = useRouter()
  const { user: authUser, workspaceId, logout } = useAuthStore()
  const [settings, setSettings] = useState<any>({})
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    settingsRepository.getSettings(workspaceId).then((s) => {
      setSettings(s)
      if (s) {
        localStorage.setItem('company_country', s.company_country || 'FR')
        localStorage.setItem('currency_symbol', s.currency_symbol || 'FCFA')
      }
    })
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
    await settingsRepository.saveSettings(workspaceId, settings)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    router.push('/login')
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurez votre entreprise et votre application</p>
      </div>

      <Tabs defaultValue={['admin', 'superadmin'].includes(authUser?.role as string) ? "company" : "account"} className="space-y-6">
        <TabsList className="bg-card border border-border">
          {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="company"><Building className="w-4 h-4 mr-2" />Entreprise</TabsTrigger>
          )}
          {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" />Emails (SMTP)</TabsTrigger>
          )}
          {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
            <TabsTrigger value="documents"><FileText className="w-4 h-4 mr-2" />Documents & CGV</TabsTrigger>
          )}
          {hasPermission(authUser?.role, PERMISSIONS.MANAGE_FEDAPAY) && (
            <TabsTrigger value="payments"><CreditCard className="w-4 h-4 mr-2" />FedaPay (Paiements)</TabsTrigger>
          )}
          <TabsTrigger value="account"><LogOut className="w-4 h-4 mr-2" />Compte</TabsTrigger>
        </TabsList>

        {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
          <TabsContent value="company">
            <Card className="border border-border shadow-sm">
              <CardHeader><CardTitle>Informations de l'entreprise</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nom de l'entreprise</Label>
                    <Input value={settings.company_name || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_name: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Adresse postale</Label>
                    <Input value={settings.company_address || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={settings.company_phone || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de contact</Label>
                    <Input type="email" value={settings.company_email || ''} onChange={(e) => setSettings((s: any) => ({ ...s, company_email: e.target.value }))} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Pays de l'entreprise (Facturation par défaut)</Label>
                    <Select value={settings.company_country || 'FR'} onValueChange={handleCountryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez le pays" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FR">France 🇫🇷</SelectItem>
                        <SelectItem value="US">États-Unis (USA) 🇺🇸</SelectItem>
                        <SelectItem value="BJ">Bénin 🇧🇯</SelectItem>
                        <SelectItem value="BF">Burkina Faso 🇧🇫</SelectItem>
                        <SelectItem value="CI">Côte d'Ivoire 🇨🇮</SelectItem>
                        <SelectItem value="GW">Guinée-Bissau 🇬🇼</SelectItem>
                        <SelectItem value="ML">Mali 🇲🇱</SelectItem>
                        <SelectItem value="NE">Niger 🇳🇪</SelectItem>
                        <SelectItem value="SN">Sénégal 🇸🇳</SelectItem>
                        <SelectItem value="TG">Togo 🇹🇬</SelectItem>
                        <SelectItem value="OTHER">Autre pays 🌍</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>TVA/Taxe par défaut (%)</Label>
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
                <div className="grid grid-cols-2 gap-8">
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
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="min-w-[140px]">
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
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
                    <Input type="number" value={settings.smtp_port || ''} onChange={(e) => setSettings((s: any) => ({ ...s, smtp_port: e.target.value }))} placeholder="465 ou 587" />
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
                <div className="flex justify-between items-center pt-4">
                  <p className="text-xs text-muted-foreground italic">Note: Les mots de passe sont stockés de manière sécurisée.</p>
                  <Button onClick={handleSave} disabled={loading}>
                    {saved ? <><Check className="w-4 h-4 mr-2" />Enregistré</> : <><Save className="w-4 h-4 mr-2" />Enregistrer</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission(authUser?.role, PERMISSIONS.MANAGE_SETTINGS) && (
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

        {hasPermission(authUser?.role, PERMISSIONS.MANAGE_FEDAPAY) && (
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
                  <Label>Environnement</Label>
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
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <LogOut className="w-5 h-5" /> Session utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous êtes actuellement connecté en tant que <strong>{authUser?.full_name || 'utilisateur'}</strong>. 
                Toutes vos modifications non enregistrées seront perdues lors de la déconnexion.
              </p>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Se déconnecter de l'application
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
