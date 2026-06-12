import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailService } from '@/lib/services/email.service'
import { whatsappService } from '@/lib/services/whatsapp.service'

// Cette route est appelée par Vercel Cron (ex: tous les jours à 08h00)
export async function GET(request: Request) {
  try {
    // SÉCURITÉ : Vérifier le CRON_SECRET
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 1. Récupérer toutes les entreprises qui ont activé les relances
    const { data: workspacesSettings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('workspace_id, key, value')
      .in('key', ['auto_reminder_enabled', 'auto_reminder_days', 'auto_reminder_channels', 'auto_reminder_template', 'currency_symbol'])

    if (settingsError) throw settingsError

    // Organiser les paramètres par workspace_id
    const settingsByWorkspace = new Map<string, any>()
    workspacesSettings.forEach(row => {
      if (!settingsByWorkspace.has(row.workspace_id)) {
        settingsByWorkspace.set(row.workspace_id, {
          auto_reminder_enabled: 'false',
          auto_reminder_days: '1',
          auto_reminder_channels: 'email,whatsapp',
          auto_reminder_template: '',
          currency_symbol: 'FCFA'
        })
      }
      settingsByWorkspace.get(row.workspace_id)[row.key] = row.value
    })

    const activeWorkspaceIds = Array.from(settingsByWorkspace.entries())
      .filter(([_, settings]) => settings.auto_reminder_enabled === 'true')
      .map(([id]) => id)

    if (activeWorkspaceIds.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "Aucune entreprise avec les relances actives." })
    }

    // 2. Récupérer les factures impayées de ces entreprises (qui n'ont pas encore été relancées)
    // On suppose que la colonne auto_reminder_sent a été ajoutée via la migration SQL.
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('*, client:clients(full_name, phone, email)')
      .in('workspace_id', activeWorkspaceIds)
      .eq('document_type', 'invoice')
      .in('status', ['unpaid', 'partial'])
      .eq('auto_reminder_sent', false)

    if (invoicesError) throw invoicesError

    let processedCount = 0
    const todayDate = new Date()

    // 3. Traiter chaque facture
    for (const invoice of invoices || []) {
      const settings = settingsByWorkspace.get(invoice.workspace_id)
      if (!settings) continue
      
      if (!invoice.due_date) continue

      // Calculer la différence en jours entre aujourd'hui et la due_date
      const dueDate = new Date(invoice.due_date)
      // Normaliser à minuit pour comparer les dates
      const today = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())
      const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
      
      const diffTime = due.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const targetDays = parseInt(settings.auto_reminder_days || '1', 10)

      // Si le nombre de jours correspond au réglage (ex: 1 jour avant l'échéance)
      if (diffDays === targetDays) {
        
        const channels = (settings.auto_reminder_channels || '').split(',')
        const client = invoice.client
        
        let template = settings.auto_reminder_template || 'Bonjour {client}, votre facture {facture} d\'un montant de {montant} arrive à échéance {date}. Merci de régulariser.'
        
        // Remplacer les variables
        let message = template
          .replace(/{client}/g, client?.full_name || 'Client')
          .replace(/{facture}/g, invoice.invoice_number)
          .replace(/{montant}/g, `${invoice.grand_total} ${settings.currency_symbol}`)
          .replace(/{date}/g, diffDays > 0 ? `dans ${diffDays} jour(s)` : (diffDays === 0 ? `aujourd'hui` : `depuis ${Math.abs(diffDays)} jour(s)`))

        let reminded = false

        // Envoi WhatsApp
        if (channels.includes('whatsapp') && client?.phone) {
          const sentWa = await whatsappService.sendReminder(invoice.workspace_id, client.phone, message)
          if (sentWa) reminded = true
        }

        // Envoi Email
        if (channels.includes('email') && client?.email) {
          const sentEmail = await emailService.sendAutoReminder(
            invoice.workspace_id, 
            client.email, 
            `Relance: Facture ${invoice.invoice_number}`, 
            message
          )
          if (sentEmail) reminded = true
        }

        // 4. Si la relance a fonctionné par au moins un canal, on met à jour la facture
        if (reminded) {
          await supabaseAdmin
            .from('invoices')
            .update({ auto_reminder_sent: true })
            .eq('id', invoice.id)
            
          processedCount++
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })

  } catch (error) {
    console.error('Erreur Cron Relances Automatiques:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
