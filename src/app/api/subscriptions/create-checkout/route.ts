import { NextResponse } from 'next/server'
import { FedaPay, Transaction } from 'fedapay'
import { supabase } from '@/lib/supabase'

// On utilise la clé FedaPay GOBALE de la plateforme pour encaisser les abonnements
const PLATFORM_FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY
const PLATFORM_FEDAPAY_ENV = process.env.FEDAPAY_ENVIRONMENT || 'sandbox'

const PLAN_PRICES: Record<string, { monthly: number, yearly: number }> = {
  starter: { monthly: 4900, yearly: 49000 },
  business: { monthly: 14900, yearly: 149000 },
  agency: { monthly: 29000, yearly: 290000 }
}

export async function POST(req: Request) {
  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const { plan, interval = 'monthly', workspace_id } = body

    if (!plan || !PLAN_PRICES[plan] || !workspace_id) {
      return NextResponse.json({ error: 'Plan invalide ou workspace manquant' }, { status: 400 })
    }

    const isYearly = interval === 'yearly'
    const amount = isYearly ? PLAN_PRICES[plan].yearly : PLAN_PRICES[plan].monthly

    if (!PLATFORM_FEDAPAY_SECRET_KEY) {
      return NextResponse.json({ error: 'La plateforme n\'a pas configuré sa clé FedaPay globale.' }, { status: 500 })
    }

    // Configurer FedaPay avec la clé GLOBALE
    FedaPay.setApiKey(PLATFORM_FEDAPAY_SECRET_KEY)
    FedaPay.setEnvironment(PLATFORM_FEDAPAY_ENV as 'sandbox' | 'live')

    // Créer la transaction FedaPay
    const transaction = await Transaction.create({
      description: `Abonnement IT-Facture - Plan ${plan.toUpperCase()} (${isYearly ? 'Annuel' : 'Mensuel'})`,
      amount: amount,
      currency: { iso: 'XOF' },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade?upgrade=canceled`,
      custom_metadata: {
        type: 'saas_subscription',
        workspace_id: workspace_id,
        plan: plan,
        interval: interval
      },
      customer: {
        firstname: user.user_metadata?.full_name || 'Client',
        lastname: 'IT-Facture',
        email: user.email || '',
      }
    })

    const token = await transaction.generateToken()
    return NextResponse.json({ success: true, url: token.url })

  } catch (error: any) {
    console.error('Erreur FedaPay SaaS:', error.response?.data || error)
    
    let errorDetails = error.message
    if (error.response?.data) {
      const data = error.response.data
      errorDetails = data.message || errorDetails
      if (data.errors) {
        // Formater les erreurs imbriquées (ex: { amount: ["Le montant maximum..."] })
        const details = Object.entries(data.errors)
          .map(([key, msgs]) => `${key}: ${(msgs as string[]).join(', ')}`)
          .join(' | ')
        errorDetails += ` (${details})`
      }
    }
    
    return NextResponse.json({ error: `Erreur FedaPay: ${errorDetails}` }, { status: 500 })
  }
}
