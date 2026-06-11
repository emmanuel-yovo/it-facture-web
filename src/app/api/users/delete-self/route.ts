import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // On appelle la RPC delete_user_completely pour nettoyer proprement le profil, le workspace (si propriétaire) et le compte auth.
    const { error: deleteError } = await supabaseAdmin.rpc('delete_user_completely', {
      user_id: user.id
    })

    if (deleteError) {
      console.error('Erreur suppression de son propre compte:', deleteError)
      return NextResponse.json({ error: `Erreur DB: ${deleteError.message} / ${deleteError.details}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('API Delete Self Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
