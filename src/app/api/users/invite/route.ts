import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Verify admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, workspace_id, workspaces(plan, subscription_end_date)')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Droits insuffisants' }, { status: 403 })
    }

    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email et rôle requis' }, { status: 400 })
    }

    // Insert invitation
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days valid

    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        workspace_id: profile.workspace_id,
        email: email,
        role: role,
        expires_at: expiresAt.toISOString()
      })
      .select('token')
      .single()

    if (inviteError) {
      console.error('Erreur création invitation:', inviteError)
      return NextResponse.json({ error: "Erreur lors de la création de l'invitation" }, { status: 500 })
    }

    // Send email using Resend
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inviteData.token}`

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'IT-Facture <onboarding@resend.dev>', // Ou votre domaine vérifié sur Resend
          to: email,
          subject: 'Invitation à rejoindre une entreprise sur IT-Facture',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Vous avez été invité !</h2>
              <p style="color: #555; line-height: 1.5;">L'administrateur de l'entreprise vous invite à rejoindre son espace de travail sur IT-Facture.</p>
              <p style="color: #555; line-height: 1.5;">Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
              <div style="margin: 30px 0;">
                <a href="${inviteLink}" style="padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accepter l'invitation</a>
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 40px;">Ce lien est sécurisé et restera valide pendant 7 jours.</p>
            </div>
          `
        })
      } else {
        console.warn('RESEND_API_KEY missing, printing invite link to console:', inviteLink)
      }
    } catch (emailErr) {
      console.error('Erreur envoi email via Resend:', emailErr)
      // On continue car l'invitation est bien créée en base
    }

    return NextResponse.json({ success: true, message: 'Invitation envoyée avec succès.' })

  } catch (err: any) {
    console.error('API Invite Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

