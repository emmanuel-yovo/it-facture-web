import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: Request) {
  try {
    // 1. Authentifier la requête
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Extraire l'ID de l'utilisateur à supprimer
    const { userIdToDelete } = await req.json()

    if (!userIdToDelete) {
      return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 })
    }

    // Protection : on ne peut pas se supprimer soi-même via cette route d'équipe (ou si on le veut, il faut une logique différente)
    if (user.id === userIdToDelete) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte ici.' }, { status: 400 })
    }

    // 3. Vérifier les permissions de celui qui supprime (doit être admin ou superadmin)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Droits insuffisants pour supprimer un membre' }, { status: 403 })
    }

    // 4. Vérifier que l'utilisateur cible appartient bien au même workspace
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('workspace_id, role')
      .eq('id', userIdToDelete)
      .single()

    if (!targetProfile || targetProfile.workspace_id !== profile.workspace_id) {
      return NextResponse.json({ error: 'Cet utilisateur n\'appartient pas à votre entreprise.' }, { status: 403 })
    }

    // Protection : Seul un superadmin peut supprimer un admin
    if (targetProfile.role === 'superadmin') {
      return NextResponse.json({ error: 'Impossible de supprimer un superadmin.' }, { status: 403 })
    }
    
    if (targetProfile.role === 'admin' && profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Seul un superadministrateur peut supprimer un administrateur.' }, { status: 403 })
    }

    // 5. Supprimer l'utilisateur via notre nouvelle fonction RPC qui nettoie tout
    const { error: deleteError } = await supabaseAdmin.rpc('delete_user_completely', {
      user_id: userIdToDelete
    })

    if (deleteError) {
      console.error('Erreur suppression via RPC:', deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression de l'utilisateur." }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('API Delete Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
