import { NextResponse } from 'next/server'
import { FedaPay, Transaction } from 'fedapay'
import { supabase } from '@/lib/supabase'

// Configuration de FedaPay (idéalement chargée depuis .env.local)
const FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY || 'sk_sandbox_xxx'
const FEDAPAY_ENVIRONMENT = process.env.FEDAPAY_ENVIRONMENT || 'sandbox'

FedaPay.setApiKey(FEDAPAY_SECRET_KEY)
FedaPay.setEnvironment(FEDAPAY_ENVIRONMENT as 'sandbox' | 'live')

export async function POST(req: Request) {
  try {
    // SÉCURITÉ : Vérifier que l'utilisateur est connecté
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await req.json()
    const { invoice_id, amount, description, client_email, client_name, workspace_id } = body

    if (!invoice_id || !amount) {
      return NextResponse.json({ error: 'invoice_id et amount sont requis' }, { status: 400 })
    }

    // Création de la transaction FedaPay
    const transaction = await Transaction.create({
      description: description || `Paiement de la facture ${invoice_id}`,
      amount: Math.round(amount),
      currency: { iso: 'XOF' }, // FCFA par défaut
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoice_id}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoice_id}?payment=canceled`,
      custom_metadata: {
        invoice_id,
        workspace_id
      },
      customer: {
        firstname: client_name || 'Client',
        lastname: '',
        email: client_email || 'client@example.com',
      }
    })

    // Générer le lien de paiement
    const token = await transaction.generateToken()
    const paymentUrl = token.url

    return NextResponse.json({ success: true, url: paymentUrl, transaction_id: transaction.id })
  } catch (error: any) {
    console.error('Erreur FedaPay:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de la transaction' }, { status: 500 })
  }
}
