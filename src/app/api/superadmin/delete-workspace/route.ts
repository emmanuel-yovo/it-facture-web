import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const token = authHeader.replace('Bearer ', '')
    const body = await req.json()
    const { workspace_id } = body
    
    if (!workspace_id) return NextResponse.json({ error: 'ID de l\'entreprise manquant' }, { status: 400 })

    // 1. Initialiser le client normal pour vérifier l'identité de l'appelant
    const supabaseNormal = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await supabaseNormal.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })

    // 2. Vérifier que l'utilisateur est bien SuperAdmin
    const { data: profile } = await supabaseNormal
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé. Réservé au SuperAdmin.' }, { status: 403 })
    }

    // 3. Initialiser le client Admin (Service Role) pour contourner les RLS et forcer la suppression
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Détacher les profils du workspace (Option 2 : On ne supprime pas les comptes auth, on les déconnecte)
    const { error: detachError } = await supabaseAdmin
      .from('profiles')
      .update({ workspace_id: null })
      .eq('workspace_id', workspace_id)

    if (detachError) {
      console.error('Detach error:', detachError)
      return NextResponse.json({ error: 'Erreur lors du détachement des profils' }, { status: 500 })
    }

    // 5. Supprimer le workspace (La cascade ON DELETE supprimera factures, clients, services, etc.)
    const { error: deleteError } = await supabaseAdmin
      .from('workspaces')
      .delete()
      .eq('id', workspace_id)

    if (deleteError) {
      console.error('Delete workspace error:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression de l\'entreprise' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
