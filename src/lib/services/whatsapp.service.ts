import { supabaseAdmin } from '../supabase-admin'

export class WhatsAppService {
  /**
   * Envoie un message WhatsApp et déduit 1 crédit
   */
  async sendReminder(workspaceId: string, toPhone: string, message: string): Promise<boolean> {
    try {
      // 1. Nettoyer le numéro de téléphone (enlever les espaces, etc.)
      const phone = toPhone.replace(/\s+/g, '')
      if (!phone) return false

      // 2. Vérifier les crédits de l'entreprise
      const { data, error } = await supabaseAdmin
        .from('workspaces')
        .select('communication_credits')
        .eq('id', workspaceId)
        .single()
        
      if (error || !data) {
        console.error('Erreur lors de la vérification des crédits:', error)
        return false
      }

      if (data.communication_credits <= 0) {
        console.warn(`Crédits insuffisants pour l'entreprise ${workspaceId} pour envoyer un WhatsApp.`)
        return false
      }

      // 3. Envoyer le message (Simulation / Stub Meta Cloud API)
      // Ici, on utilisera l'API officielle de WhatsApp Business / Meta.
      // Il faudra configurer les tokens globaux du Superadmin dans .env
      // const META_TOKEN = process.env.WHATSAPP_TOKEN
      // const PHONE_ID = process.env.WHATSAPP_PHONE_ID
      
      console.log(`[WHATSAPP API - STUB] À: ${phone} | Message: ${message}`)
      
      /* Exemple de véritable requête API Meta
      const res = await fetch(`https://graph.facebook.com/v17.0/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${META_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message }
        })
      })
      if (!res.ok) throw new Error('WhatsApp API error')
      */

      // 4. Déduire 1 crédit
      await supabaseAdmin
        .from('workspaces')
        .update({ communication_credits: data.communication_credits - 1 })
        .eq('id', workspaceId)

      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi WhatsApp:', error)
      return false
    }
  }
}

export const whatsappService = new WhatsAppService()
