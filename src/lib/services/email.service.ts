import nodemailer from 'nodemailer'
import { settingsRepository } from '../repositories/settings.repository'
import { supabaseAdmin } from '../supabase-admin'
import { decrypt } from '../encryption'

export class EmailService {
  async sendPaymentLink(workspaceId: string, to: string, invoiceNumber: string, amount: number, paymentLink: string) {
    const settings = await settingsRepository.getSettings(workspaceId)
    
    // Fetch encrypted SMTP password
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'smtp_pass')
      .single()
      
    const smtpPass = data ? decrypt(data.value) : null

    // Check if SMTP is configured
    if (!settings.smtp_host || !settings.smtp_user || !smtpPass) {
      console.error('SMTP non configuré pour ce workspace')
      return false
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port) || 587,
      secure: Number(settings.smtp_port) === 465,
      auth: {
        user: settings.smtp_user,
        pass: smtpPass
      }
    })

    const currencySymbol = settings.currency_symbol || 'FCFA'
    
    const mailOptions = {
      from: `"${settings.company_name || 'IT-Facture'}" <${settings.smtp_user}>`,
      to,
      subject: `Votre facture ${invoiceNumber} est prête`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333;">Bonjour,</h2>
          <p>Votre facture <strong>${invoiceNumber}</strong> pour le renouvellement de votre abonnement est prête.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Montant à payer : <strong>${amount} ${currencySymbol}</strong></p>
          </div>
          <p>Vous pouvez régler cette facture facilement et en toute sécurité (Carte Bancaire ou Mobile Money) en cliquant sur le bouton ci-dessous :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Payer ma facture</a>
          </div>
          <p style="color: #666; font-size: 14px;">Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
          <a href="${paymentLink}">${paymentLink}</a></p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center;">Merci pour votre confiance, <br/>${settings.company_name || 'Votre Partenaire'}</p>
        </div>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  async sendInvoiceEmail(workspaceId: string, to: string, subject: string, htmlBody: string, pdfUrl?: string) {
    const settings = await settingsRepository.getSettings(workspaceId)
    
    // Fetch encrypted SMTP password
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('workspace_id', workspaceId)
      .eq('key', 'smtp_pass')
      .single()
      
    const smtpPass = data ? decrypt(data.value) : null

    if (!settings.smtp_host) {
      throw new Error('Hôte SMTP non configuré')
    }
    if (!settings.smtp_user) {
      throw new Error('Utilisateur SMTP non configuré')
    }
    if (!data) {
      throw new Error('Mot de passe SMTP introuvable dans la base')
    }
    if (!smtpPass) {
      throw new Error('Le mot de passe SMTP n a pas pu être déchiffré. Veuillez le saisir à nouveau et enregistrer.')
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: Number(settings.smtp_port) || 587,
      secure: Number(settings.smtp_port) === 465,
      auth: {
        user: settings.smtp_user,
        pass: smtpPass
      }
    })

    const mailOptions: any = {
      from: `"${settings.company_name || 'IT-Facture'}" <${settings.smtp_user}>`,
      to,
      subject,
      html: htmlBody
    }

    if (pdfUrl) {
      mailOptions.attachments = [
        {
          filename: subject.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf',
          path: pdfUrl
        }
      ]
    }

    await transporter.sendMail(mailOptions)
    return true
  }
}

export const emailService = new EmailService()
