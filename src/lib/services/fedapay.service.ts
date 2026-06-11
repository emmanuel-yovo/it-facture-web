import { FedaPay, Transaction } from 'fedapay'
import { settingsRepository } from '../repositories/settings.repository'
import { supabaseAdmin } from '../supabase-admin'
import { decrypt } from '../encryption'

export class FedaPayService {
  async initFedaPay(workspaceId: string) {
    const settings = await settingsRepository.getSettings(workspaceId)
    
    // Fetch encrypted FedaPay secret
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'fedapay_secret_key')
      .single()
      
    const dbSecretKey = data ? decrypt(data.value) : null

    // We expect the user to have configured FedaPay keys in settings, or we use ENV vars
    // For now, if no settings, fallback to process.env
    const secretKey = dbSecretKey || process.env.FEDAPAY_SECRET_KEY
    const env = settings.fedapay_environment || process.env.FEDAPAY_ENVIRONMENT || 'sandbox'

    if (!secretKey) {
      throw new Error('FedaPay Secret Key is not configured')
    }

    FedaPay.setApiKey(secretKey as string)
    FedaPay.setEnvironment(env as string)
  }

  async createPaymentLink(workspaceId: string, amount: number, invoiceNumber: string, clientEmail: string, clientName: string) {
    await this.initFedaPay(workspaceId)

    const [firstname, ...lastnameParts] = clientName.split(' ')
    const lastname = lastnameParts.join(' ') || 'Client'

    try {
      const transaction = await Transaction.create({
        description: `Paiement Facture ${invoiceNumber}`,
        amount: Math.round(amount),
        currency: { iso: 'XOF' }, // FedaPay primarily uses XOF for Mobile Money
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices`,
        customer: {
          firstname,
          lastname,
          email: clientEmail
        }
      })

      const token = await transaction.generateToken()
      return token.url
    } catch (error) {
      console.error('Erreur de génération de lien FedaPay:', error)
      throw error
    }
  }
}

export const fedapayService = new FedaPayService()
