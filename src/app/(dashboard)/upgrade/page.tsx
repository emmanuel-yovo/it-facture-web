'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Zap, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Pour tester et découvrir',
    features: ['Jusqu\'à 5 factures/mois', 'Base de 3 clients', 'Envoi par PDF', 'Support communautaire'],
    type: 'free',
    buttonText: 'Plan actuel',
    isCurrent: (plan: string) => plan === 'free',
    popular: false
  },
  {
    name: 'Starter',
    price: { monthly: 4900, yearly: 49000 },
    description: 'L\'essentiel pour se lancer sereinement.',
    features: ['Jusqu\'à 50 factures/mois', 'Base de 50 clients', 'Envoi par PDF professionnel', 'Support par E-mail'],
    type: 'starter',
    buttonText: 'Passer à Starter',
    isCurrent: (plan: string) => plan === 'starter',
    popular: false
  },
  {
    name: 'Business',
    price: { monthly: 14900, yearly: 149000 },
    description: 'La machine de guerre pour PME.',
    features: ['Clients & Factures Illimités', 'Paiement en ligne via FedaPay', 'Gestion des Dépenses', 'Gestion des Tickets SAV', 'Jusqu\'à 3 collaborateurs'],
    type: 'business',
    buttonText: 'Passer à Business',
    isCurrent: (plan: string) => plan === 'business',
    popular: true
  },
  {
    name: 'Agency',
    price: { monthly: 29000, yearly: 290000 },
    description: 'Pour les grandes équipes sans compromis.',
    features: ['Tout du plan Business', 'Utilisateurs illimités (Équipe)', 'Tableau de bord multi-agences', 'Account Manager dédié'],
    type: 'agency',
    buttonText: 'Passer à Agency',
    isCurrent: (plan: string) => plan === 'agency',
    popular: false
  }
]

export default function UpgradePage() {
  const { t } = useTranslation()
  const { workspacePlan, workspaceId } = useAuthStore()
  const currentPlan = workspacePlan || 'free'
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<{planType: string, amount: number, name: string} | null>(null)
  

  const handleUpgrade = async (planType: string) => {
    if (!workspaceId || planType === 'free') return
    setLoadingPlan(planType)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          plan: planType, 
          workspace_id: workspaceId,
          interval: isYearly ? 'yearly' : 'monthly'
        })
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
      setPaymentModalOpen(false)
    }
  }

  const handleKkiapayUpgrade = (planType: string, amount: number) => {
    if (!workspaceId || planType === 'free') return
    const pubKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
    if (!pubKey) {
      alert("La clé KkiaPay n'est pas configurée.")
      return
    }

    const paymentStateData = JSON.stringify({
      type: 'saas_subscription',
      workspace_id: workspaceId,
      plan: planType,
      interval: isYearly ? 'yearly' : 'monthly'
    });

    (window as any).openKkiapayWidget({
      amount: amount,
      position: "center",
      callback: `${window.location.origin}/settings?upgrade=success`,
      data: paymentStateData, // Transmis dans le custom data 'state'
      theme: "#10b981", // Vert émeraude
      sandbox: true,
      key: pubKey
    })
    setPaymentModalOpen(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('upgrade.title', 'Débloquez tout le potentiel de IT-Facture')}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t('upgrade.subtitle', 'Choisissez le plan qui correspond à la taille de votre entreprise. Encaissez vos clients plus vite et gagnez un temps précieux.')}
        </p>

        {/* Toggle Annuel / Mensuel */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Label htmlFor="billing-toggle" className={`text-lg ${!isYearly ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>Mensuel</Label>
          <Switch 
            id="billing-toggle" 
            checked={isYearly} 
            onCheckedChange={setIsYearly} 
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="billing-toggle" className={`text-lg flex items-center gap-2 ${isYearly ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
            Annuel
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">2 Mois Offerts</Badge>
          </Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {PLANS.map((plan) => {
          const price = isYearly ? plan.price.yearly : plan.price.monthly
          
          return (
            <Card 
              key={plan.name} 
              className={`relative flex flex-col ${plan.isCurrent(currentPlan) ? 'border-primary shadow-md' : 'border-border'} ${plan.popular ? 'border-blue-500 shadow-blue-500/10 shadow-xl scale-105 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-blue-500 hover:bg-blue-600 border-none px-3 py-1">Le plus populaire 🔥</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px] mt-2">{plan.description}</CardDescription>
                <div className="pt-4 pb-2 flex items-end gap-1">
                  <span className="text-4xl font-black">{price.toLocaleString('fr-FR')}</span>
                  <span className="text-lg font-bold text-muted-foreground mb-1">FCFA</span>
                  <span className="text-sm text-muted-foreground mb-1"> / {isYearly ? 'an' : 'mois'}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-foreground/80 leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button 
                  variant={plan.isCurrent(currentPlan) ? 'outline' : (plan.popular ? 'default' : 'secondary')}
                  className={`w-full font-bold ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  disabled={plan.isCurrent(currentPlan) || loadingPlan !== null || plan.type === 'free'}
                  onClick={() => {
                    setSelectedPlanToUpgrade({ planType: plan.type, amount: price, name: plan.name })
                    setPaymentModalOpen(true)
                  }}
                >
                  {loadingPlan === plan.type ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Préparation...</>
                  ) : plan.isCurrent(currentPlan) ? (
                    'Plan Actuel'
                  ) : plan.type === 'free' ? (
                    'Inclus par défaut'
                  ) : (
                    <>Passer à {plan.name} <Zap className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 bg-muted/30 border border-border rounded-xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg">{t('upgrade.howItWorks', 'Comment se passe le paiement ?')}</h3>
          <p className="text-muted-foreground mt-1">
            Les abonnements sont gérés de manière sécurisée via FedaPay ou KkiaPay. Vous pouvez payer par <strong>Mobile Money (MoMo, Flooz)</strong> ou par <strong>Carte Bancaire</strong>.
          </p>
        </div>
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choisissez votre méthode de paiement</DialogTitle>
            <DialogDescription>
              Comment souhaitez-vous régler votre abonnement au plan <strong>{selectedPlanToUpgrade?.name}</strong> ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button 
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => selectedPlanToUpgrade && handleUpgrade(selectedPlanToUpgrade.planType)}
            >
              Payer via FedaPay
            </Button>
            <Button 
              variant="outline"
              className="w-full h-14 text-lg font-bold text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              onClick={() => selectedPlanToUpgrade && handleKkiapayUpgrade(selectedPlanToUpgrade.planType, selectedPlanToUpgrade.amount)}
            >
              Payer via KkiaPay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
