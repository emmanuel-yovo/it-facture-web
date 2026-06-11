'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, KeyRound, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { loading: authLoading } = useAuth() // Permet de recharger la session si on rafraîchit la page
  const { workspaceId, user } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // États pour "Créer"
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('Bénin')
  const [currency, setCurrency] = useState('XOF')

  // États pour "Rejoindre"
  const [joinCode, setJoinCode] = useState('')

  const generateCompanyCode = () => {
    // Génère un code de 6 caractères (lettres majuscules et chiffres)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'ITF-'
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError('')
    try {
      const newCompanyCode = generateCompanyCode()
      let currentWorkspaceId = workspaceId

      if (!currentWorkspaceId) {
        // 1a. Créer un nouveau workspace
        const { data: newWs, error: wsError } = await supabase
          .from('workspaces')
          .insert({ 
            name: companyName || 'Mon Entreprise',
            company_code: newCompanyCode,
            owner_id: user.id
          })
          .select('id')
          .single()

        if (wsError) throw wsError
        currentWorkspaceId = newWs.id
      } else {
        // 1b. Mettre à jour le workspace actuel (si auto-créé par Supabase)
        await supabase
          .from('workspaces')
          .update({ 
            name: companyName || 'Mon Entreprise',
            company_code: newCompanyCode
          })
          .eq('id', currentWorkspaceId)
      }

      // 2. Mettre à jour le profil pour assigner le rôle 'admin' et le workspace_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin', workspace_id: currentWorkspaceId })
        .eq('id', user.id)
      
      if (profileError) throw profileError

      // 3. Sauvegarder les settings initiaux
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert([
          { workspace_id: currentWorkspaceId, key: 'company_name', value: companyName },
          { workspace_id: currentWorkspaceId, key: 'country', value: country },
          { workspace_id: currentWorkspaceId, key: 'currency', value: currency }
        ])
        
      if (settingsError) throw settingsError

      // Rediriger vers le dashboard
      window.location.href = '/' // Force reload pour recharger le state Auth
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('auth.genericError', 'Une erreur est survenue.'))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    setError('')
    try {
      // Appeler la fonction RPC Postgres pour rejoindre le workspace
      const { data: success, error: rpcError } = await supabase.rpc('join_workspace', {
        invite_code: joinCode.trim().toUpperCase()
      })

      if (rpcError) throw rpcError

      if (success) {
        // Rediriger vers le dashboard (force reload)
        window.location.href = '/'
      } else {
        setError(t('onboarding.errorInvalidCode', "Code invalide ou entreprise introuvable."))
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('onboarding.errorJoin', "Impossible de rejoindre l'entreprise."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative z-10 mx-4"
      >
        <h1 className="text-2xl font-bold mb-2 text-center">{t('onboarding.welcome', 'Bienvenue ! 🎉')}</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {t('onboarding.welcomeDesc', 'Avant de commencer, configurez votre accès à IT-Facture.')}
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              {t('onboarding.tabCreate', 'Créer')}
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              {t('onboarding.tabJoin', 'Rejoindre')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('onboarding.companyName', 'Nom de votre entreprise')}</Label>
                <Input
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('onboarding.companyPlaceholder', 'Ex: IT-Facture SARL')}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.country', 'Pays')}</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="Bénin">Bénin</option>
                    <option value="Togo">Togo</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="France">France</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('onboarding.currency', 'Devise')}</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="XAF">FCFA (XAF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full mt-6" disabled={loading || authLoading}>
                {loading ? t('onboarding.btnCreating', "Configuration en cours...") : t('onboarding.btnCreate', "Créer et commencer")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('onboarding.companyId', "Identifiant de l'entreprise (Company ID)")}</Label>
                <Input
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder={t('onboarding.companyIdPlaceholder', "Ex: ITF-8X4B2")}
                  className="font-mono uppercase text-center tracking-wider text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {t('onboarding.companyIdHint', "Demandez cet identifiant à l'administrateur de votre entreprise.")}
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-lg flex items-start gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full mt-6" disabled={loading || authLoading || !joinCode}>
                {loading ? t('onboarding.btnJoining', "Vérification...") : t('onboarding.btnJoin', "Rejoindre l'entreprise")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
