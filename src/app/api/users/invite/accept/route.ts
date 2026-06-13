import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const sessionToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    // 1. Fetch invitation using admin privileges
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invitation invalide ou introuvable.' }, { status: 404 })
    }

    // 2. Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cette invitation a expiré.' }, { status: 400 })
    }

    // 3. Update the user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        workspace_id: invitation.workspace_id,
        role: invitation.role
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Erreur mise à jour profil:', profileError)
      return NextResponse.json({ error: 'Erreur lors de l\'acceptation de l\'invitation.' }, { status: 500 })
    }

    // 4. Delete the invitation to prevent reuse
    await supabaseAdmin
      .from('invitations')
      .delete()
      .eq('id', invitation.id)

    return NextResponse.json({ success: true, workspace_id: invitation.workspace_id })

  } catch (err: any) {
    console.error('API Invite Accept Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
