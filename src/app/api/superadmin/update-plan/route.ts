import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

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

    // Vérification stricte du rôle superadmin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Droits insuffisants. Rôle superadmin requis.' }, { status: 403 })
    }

    const { workspace_id, plan } = await req.json()

    if (!workspace_id || !plan) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    // Mise à jour du plan du workspace
    const { error: updateError } = await supabaseAdmin
      .from('workspaces')
      .update({ plan })
      .eq('id', workspace_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, plan })

  } catch (err: any) {
    console.error('API Superadmin Update Plan Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
