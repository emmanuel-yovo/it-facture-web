import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase' // client for checking auth of the requester

export async function POST(req: Request) {
  try {
    // 1. Vérifier qui fait la demande (doit être auth)
    // On doit extraire le token d'autorisation du header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Vérifier que l'utilisateur est admin ou superadmin de son workspace
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Droits insuffisants pour inviter un membre' }, { status: 403 })
    }

    // 3. Récupérer les données de la requête
    const { email, role, fullName } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email et rôle requis' }, { status: 400 })
    }

    if (role !== 'user' && role !== 'comptable') {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }

    // 4. Inviter l'utilisateur via Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName,
        role: role
      }
    })

    if (inviteError) {
      console.error('Erreur invitation Supabase:', inviteError)
      // Si l'utilisateur existe déjà
      if (inviteError.message.includes('already registered')) {
        return NextResponse.json({ error: 'Cet utilisateur existe déjà' }, { status: 400 })
      }
      return NextResponse.json({ error: "Erreur lors de l'invitation" }, { status: 500 })
    }

    // 5. Créer/Mettre à jour le profil dans la base de données
    const newUserId = inviteData.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        workspace_id: profile.workspace_id,
        full_name: fullName || email.split('@')[0],
        role: role
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      return NextResponse.json({ error: 'Utilisateur invité, mais erreur lors de la création du profil.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: inviteData.user })

  } catch (err: any) {
    console.error('API Invite Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
