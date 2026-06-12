import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/services/email.service'
import { fedapayService } from '@/lib/services/fedapay.service'
import { invoiceRepository } from '@/lib/repositories/invoice.repository'
import { subscriptionRepository } from '@/lib/repositories/subscription.repository'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Cette route est appelée par Vercel Cron
export async function GET(request: Request) {
  try {
    // SÉCURITÉ : Vérifier le CRON_SECRET
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 1. Récupérer tous les abonnements actifs échus (next_billing_date <= TODAY)
    const today = new Date().toISOString().split('T')[0]
    
    // On utilise supabaseAdmin pour outrepasser les règles RLS
    // car le Cron n'appartient à aucune entreprise en particulier.
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*, client:clients(*)')
      .eq('is_active', true)
      .lte('next_billing_date', today)

    if (error) throw error

    let processedCount = 0

    // 2. Traiter chaque abonnement
    for (const sub of subscriptions || []) {
      const workspaceId = sub.workspace_id
      
      // A. Créer une nouvelle facture pour cet abonnement
      const invoiceData = {
        invoice_number: `F-${Date.now().toString().slice(-6)}`,
        client_id: sub.client_id,
        date: today,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 jours
        status: 'unpaid',
        subtotal: sub.amount,
        vat_total: 0,
        discount_total: 0,
        total: sub.amount,
        items: [{
          service_id: undefined,
          service_name: sub.title,
          quantity: 1,
          unit_price: sub.amount,
          vat_percentage: 0
        }],
        notes: "Facture générée automatiquement via votre abonnement."
      }

      await invoiceRepository.create(workspaceId, invoiceData)

      // B. Générer le lien de paiement FedaPay
      let paymentLink = ''
      try {
        if (sub.client?.email) {
          paymentLink = await fedapayService.createPaymentLink(
            workspaceId,
            sub.amount,
            invoiceData.invoice_number,
            sub.client.email,
            sub.client.full_name
          )
        }
      } catch (err) {
        console.error(`Erreur FedaPay pour l'abonnement ${sub.id}:`, err)
      }

      // C. Envoyer l'email
      if (paymentLink && sub.client?.email) {
        await emailService.sendPaymentLink(
          workspaceId,
          sub.client.email,
          invoiceData.invoice_number,
          sub.amount,
          paymentLink
        )
      }

      // D. Mettre à jour la date du prochain prélèvement (+1 mois ou +1 an)
      const nextDate = new Date(sub.next_billing_date)
      if (sub.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1)
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1)
      }

      await supabaseAdmin
        .from('subscriptions')
        .update({ next_billing_date: nextDate.toISOString().split('T')[0] })
        .eq('id', sub.id)

      processedCount++
    }

    return NextResponse.json({ success: true, processed: processedCount })

  } catch (error) {
    console.error('Erreur Cron Abonnements:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
