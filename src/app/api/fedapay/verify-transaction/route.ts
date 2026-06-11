import { NextResponse } from 'next/server'
import { FedaPay, Transaction } from 'fedapay'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const { transaction_id } = await req.json()
    if (!transaction_id) return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    // Configurer FedaPay avec la clé GLOBALE
    const PLATFORM_FEDAPAY_SECRET_KEY = process.env.FEDAPAY_SECRET_KEY
    if (!PLATFORM_FEDAPAY_SECRET_KEY) return NextResponse.json({ error: 'Clé FedaPay manquante' }, { status: 500 })

    FedaPay.setApiKey(PLATFORM_FEDAPAY_SECRET_KEY)
    FedaPay.setEnvironment((process.env.FEDAPAY_ENVIRONMENT as any) || 'sandbox')

    // 1. Demander le statut exact de la transaction à FedaPay
    const transaction = await Transaction.retrieve(transaction_id)
    
    if (transaction.status === 'approved') {
      const metadata = transaction.custom_metadata
      
      if (metadata?.type === 'saas_subscription' && metadata?.workspace_id && metadata?.plan) {
        // Mettre à jour le plan dans la base de données
        const { error } = await supabaseAdmin
          .from('workspaces')
          .update({ plan: metadata.plan })
          .eq('id', metadata.workspace_id)
          
        if (error) throw error
        return NextResponse.json({ success: true, plan: metadata.plan })
      }
    }

    return NextResponse.json({ success: false, status: transaction.status })
  } catch (error: any) {
    console.error('Erreur Vérification FedaPay:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
