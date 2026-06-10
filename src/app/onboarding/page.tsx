'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'

export default function OnboardingPage() {
  const router = useRouter()
  const { workspaceId } = useAuthStore()
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState('Bénin')
  const [currency, setCurrency] = useState('XOF')
  const [loading, setLoading] = useState(false)

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return
    
    setLoading(true)
    try {
      // Mettre à jour le nom du workspace (facultatif si le trigger l'a déjà fait avec le nom par défaut)
      await supabase
        .from('workspaces')
        .update({ name: companyName || 'Mon Entreprise' })
        .eq('id', workspaceId)

      // Sauvegarder les settings initiaux
      await supabase
        .from('settings')
        .upsert([
          { workspace_id: workspaceId, key: 'company_name', value: companyName },
          { workspace_id: workspaceId, key: 'country', value: country },
          { workspace_id: workspaceId, key: 'currency', value: currency }
        ])

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl"
      >
        <h1 className="text-2xl font-bold mb-2">Bienvenue ! 🎉</h1>
        <p className="text-muted-foreground mb-6">
          Configurons votre espace de travail en quelques secondes.
        </p>

        <form onSubmit={handleComplete} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de votre entreprise</Label>
            <Input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: IT-Facture SARL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pays</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Label>Devise</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? "Configuration..." : "Terminer et accéder au Dashboard"}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
