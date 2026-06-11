'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Zap, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'

const PLANS = [
  {
    name: 'Freemium',
    price: '0',
    description: 'Pour démarrer',
    features: ['3 Clients max', '5 Factures max', '1 Utilisateur', 'Filigrane sur les PDF'],
    type: 'free',
    buttonText: 'Plan actuel',
    isCurrent: (plan: string) => plan === 'free'
  },
  {
    name: 'Essential',
    price: '14',
    description: 'Idéal pour les indépendants',
    features: ['Factures illimitées', 'Clients illimités', '1 Utilisateur', 'Sans filigrane', 'Support par email'],
    type: 'essential',
    buttonText: 'Passer à Essential',
    isCurrent: (plan: string) => plan === 'essential',
    popular: true
  },
  {
    name: 'Pro',
    price: '29',
    description: 'Pour les PME',
    features: ['Tout de Essential', 'Gestion des Dépenses', 'Module Tickets (SAV)', 'Multi-devises (13 devises)', 'Jusqu\'à 3 utilisateurs'],
    type: 'pro',
    buttonText: 'Passer à Pro',
    isCurrent: (plan: string) => plan === 'pro'
  },
  {
    name: 'Agence',
    price: '69',
    description: 'Pour les grandes équipes',
    features: ['Tout de Pro', 'Utilisateurs illimités', 'API E-commerce', 'Personnalisation avancée', 'Account Manager dédié'],
    type: 'agency',
    buttonText: 'Passer à Agence',
    isCurrent: (plan: string) => plan === 'agency'
  }
]

export default function UpgradePage() {
  const { t } = useTranslation()
  const { workspacePlan, workspaceId } = useAuthStore()
  const currentPlan = workspacePlan || 'free'
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleUpgrade = async (planType: string) => {
    if (!workspaceId) return
    setLoadingPlan(planType)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ plan: planType, workspace_id: workspaceId })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Erreur de génération du paiement")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur de connexion au serveur de paiement.")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">{t('upgrade.title', 'Débloquez tout le potentiel de IT-Facture')}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t('upgrade.subtitle', 'Choisissez le plan qui correspond à la taille de votre entreprise. Mettez à niveau à tout moment pour accéder à des fonctionnalités exclusives.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {PLANS.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative flex flex-col ${plan.isCurrent(currentPlan) ? 'border-primary shadow-md' : 'border-border'} ${plan.popular ? 'border-blue-500 shadow-blue-500/10 shadow-xl scale-105 z-10' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-0 right-0 flex justify-center">
                <Badge className="bg-blue-500 hover:bg-blue-600">Recommandé</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-4 pb-2">
                <span className="text-4xl font-bold">{plan.price} €</span>
                <span className="text-muted-foreground"> / mois</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={plan.isCurrent(currentPlan) ? 'outline' : (plan.popular ? 'default' : 'secondary')}
                className={`w-full ${plan.popular ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}`}
                disabled={plan.isCurrent(currentPlan) || loadingPlan !== null}
                onClick={() => handleUpgrade(plan.type)}
              >
                {loadingPlan === plan.type ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('upgrade.redirecting', 'Redirection...')}</>
                ) : plan.isCurrent(currentPlan) ? (
                  t('upgrade.currentPlan', 'Plan Actuel')
                ) : (
                  <>{t('upgrade.upgradeTo', 'Passer à')} {plan.name} <Zap className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 bg-muted/30 border border-border rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg">{t('upgrade.howItWorks', 'Comment se passe le paiement ?')}</h3>
          <p className="text-muted-foreground mt-1">
            {t('upgrade.howItWorksDesc', "Les abonnements sont gérés de manière sécurisée. Vous serez redirigé vers notre partenaire FedaPay pour finaliser votre abonnement. Vous pourrez l'annuler à tout moment depuis vos paramètres.")}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
