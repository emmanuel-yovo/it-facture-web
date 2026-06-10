import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration Supabase Admin pour bypass RLS dans le webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    // FedaPay envoie un payload JSON et un header X-Fedapay-Signature
    const signature = req.headers.get('x-fedapay-signature')
    
    // Dans un environnement de production, vous DEVEZ vérifier la signature HMAC ici 
    // avec votre FEDAPAY_SECRET_KEY pour s'assurer que la requête vient bien de FedaPay.
    
    const body = await req.json()
    console.log('Webhook FedaPay reçu:', body)

    // Vérifier que l'événement est une transaction approuvée
    if (body.entity?.name === 'transaction' && body.event?.name === 'transaction.approved') {
      const transaction = body.entity.transaction
      const status = transaction.status
      
      if (status === 'approved') {
        const metadata = transaction.custom_metadata
        const invoice_id = metadata?.invoice_id
        const workspace_id = metadata?.workspace_id
        const amount = transaction.amount

        if (invoice_id && workspace_id) {
          // 1. Enregistrer le paiement dans Supabase
          const { error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert([{
              workspace_id,
              invoice_id,
              amount: amount,
              payment_date: new Date().toISOString(),
              payment_method: 'card', // Ou mobile_money selon ce que FedaPay renvoie
              notes: `Paiement FedaPay (ID: ${transaction.id})`
            }])

          if (paymentError) throw paymentError

          // 2. Mettre à jour le statut de la facture à "paid" ou "partial"
          // Note : Idéalement on devrait vérifier si le montant total est atteint
          const { error: invoiceError } = await supabaseAdmin
            .from('invoices')
            .update({ status: 'paid' })
            .eq('id', invoice_id)

          if (invoiceError) throw invoiceError
          
          console.log(`Facture ${invoice_id} marquée comme payée avec succès via FedaPay.`)
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Erreur Webhook FedaPay:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
