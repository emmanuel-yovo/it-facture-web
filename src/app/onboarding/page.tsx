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
import { Building, AlertCircle, PartyPopper } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function OnboardingPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const { workspaceId, user } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('Bénin')
  const [currency, setCurrency] = useState('XOF')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError('')
    try {
      let currentWorkspaceId = workspaceId

      if (!currentWorkspaceId) {
        // Create new workspace since handle_new_user no longer does it automatically
        const { data: newWs, error: wsError } = await supabase
          .from('workspaces')
          .insert({ 
            name: companyName || 'Mon Entreprise',
            owner_id: user.id
          })
          .select('id')
          .single()

        if (wsError) throw wsError
        currentWorkspaceId = newWs.id
      } else {
        // Update existing workspace
        await supabase
          .from('workspaces')
          .update({ 
            name: companyName || 'Mon Entreprise'
          })
          .eq('id', currentWorkspaceId)
      }

      // Assign admin role and workspace_id to the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin', 
          role_id: '00000000-0000-0000-0000-000000000002',
          workspace_id: currentWorkspaceId 
        })
        .eq('id', user.id)
      
      if (profileError) throw profileError

      // Save initial settings
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert([
          { workspace_id: currentWorkspaceId, key: 'company_name', value: companyName },
          { workspace_id: currentWorkspaceId, key: 'country', value: country },
          { workspace_id: currentWorkspaceId, key: 'currency', value: currency }
        ])
        
      if (settingsError) throw settingsError

      window.location.href = '/' // Force reload to update Auth state
    } catch (err: any) {
      console.error(err)
      setError(err.message || t('auth.genericError', 'Une erreur est survenue.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl relative z-10 mx-4"
      >
        <h1 className="text-2xl font-bold mb-2 text-center flex justify-center items-center gap-2">{t('onboarding.welcome', 'Bienvenue !')} <PartyPopper className="w-6 h-6 text-yellow-500" /></h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">
          {t('onboarding.welcomeDesc', 'Avant de commencer, configurez votre accès à IT-Facture.')}
        </p>

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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
      </motion.div>
    </div>
  )
}
