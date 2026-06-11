import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { emailService } from '@/lib/services/email.service'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const authToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const { to, subject, htmlBody, pdfUrl, workspace_id } = body

    if (!to || !subject || !htmlBody || !workspace_id) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    await emailService.sendInvoiceEmail(workspace_id, to, subject, htmlBody, pdfUrl)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur send-email API:', error)
    return NextResponse.json({ error: error.message || 'Erreur lors de l\'envoi de l\'email' }, { status: 500 })
  }
}
