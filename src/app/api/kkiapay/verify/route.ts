import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const { kkiapay } = require("@kkiapay-org/nodejs-sdk")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const { transaction_id } = await req.json()
    if (!transaction_id) return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const PLATFORM_KKIAPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY
    const PLATFORM_KKIAPAY_PRIVATE_KEY = process.env.KKIAPAY_PRIVATE_KEY
    const PLATFORM_KKIAPAY_SECRET_KEY = process.env.KKIAPAY_SECRET_KEY
    const isSandbox = process.env.KKIAPAY_ENVIRONMENT !== 'live'

    if (!PLATFORM_KKIAPAY_PUBLIC_KEY || !PLATFORM_KKIAPAY_PRIVATE_KEY || !PLATFORM_KKIAPAY_SECRET_KEY) {
      return NextResponse.json({ error: 'Clés KkiaPay manquantes' }, { status: 500 })
    }

    const k = kkiapay({
      publickey: PLATFORM_KKIAPAY_PUBLIC_KEY,
      privatekey: PLATFORM_KKIAPAY_PRIVATE_KEY,
      secretkey: PLATFORM_KKIAPAY_SECRET_KEY,
      sandbox: isSandbox
    })

    // 1. Vérifier la transaction auprès de KkiaPay
    const response = await k.verify(transaction_id)
    
    if (response.status === 'SUCCESS') {
      const state = response.state || ''
      
      // On s'attend à ce que le widget passe custom_data contenant le type, workspace_id, etc.
      // KkiaPay retourne `state` comme custom string
      let metadata: any = {}
      try {
        if (state) metadata = JSON.parse(state)
      } catch (e) {
        console.error("Impossible de parser le state:", state)
      }

      if (metadata?.type === 'saas_subscription' && metadata?.workspace_id && metadata?.plan) {
        // Mettre à jour le plan dans la base de données
        const { error } = await supabaseAdmin
          .from('workspaces')
          .update({ plan: metadata.plan })
          .eq('id', metadata.workspace_id)
          
        if (error) throw error
        return NextResponse.json({ success: true, plan: metadata.plan })
      }
      
      // Si on veut aussi gérer les factures (invoice_id) :
      if (metadata?.type === 'invoice_payment' && metadata?.invoice_id && metadata?.workspace_id) {
         const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert([{
              workspace_id: metadata.workspace_id,
              invoice_id: metadata.invoice_id,
              amount: response.amount,
              payment_date: new Date().toISOString(),
              payment_method: 'mobile_money', // KkiaPay est principalement Mobile Money
              notes: `Paiement KkiaPay (ID: ${transaction_id})`
            }])

         if (!paymentError) {
            await supabaseAdmin.from('invoices').update({ status: 'paid' }).eq('id', metadata.invoice_id)
            return NextResponse.json({ success: true, invoice_paid: true })
         }
      }
    }

    return NextResponse.json({ success: false, status: response.status })
  } catch (error: any) {
    console.error('Erreur Vérification KkiaPay:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
