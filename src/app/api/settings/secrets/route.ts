import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(req: Request) {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Droits insuffisants' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')
      .eq('workspace_id', profile.workspace_id)
      .in('key', ['fedapay_secret_key', 'kkiapay_private_key', 'kkiapay_secret_key', 'smtp_pass'])

    if (error) throw error

    const secrets: Record<string, string> = {}
    data.forEach(row => {
      const decrypted = decrypt(row.value)
      // On masque la valeur déchiffrée
      if (decrypted) {
        if (row.key === 'fedapay_secret_key' || row.key === 'kkiapay_private_key' || row.key === 'kkiapay_secret_key') {
          secrets[row.key] = decrypted.substring(0, 8) + '********' + decrypted.slice(-4)
        } else {
          secrets[row.key] = '••••••••••••'
        }
      }
    })

    return NextResponse.json(secrets)

  } catch (err: any) {
    console.error('API Secrets GET Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Droits insuffisants' }, { status: 403 })
    }

    const body = await req.json()
    const recordsToUpsert = []

    if (body.fedapay_secret_key && !body.fedapay_secret_key.includes('********')) {
      recordsToUpsert.push({
        workspace_id: profile.workspace_id,
        key: 'fedapay_secret_key',
        value: encrypt(body.fedapay_secret_key)
      })
    }

    if (body.kkiapay_private_key && !body.kkiapay_private_key.includes('********')) {
      recordsToUpsert.push({
        workspace_id: profile.workspace_id,
        key: 'kkiapay_private_key',
        value: encrypt(body.kkiapay_private_key)
      })
    }

    if (body.kkiapay_secret_key && !body.kkiapay_secret_key.includes('********')) {
      recordsToUpsert.push({
        workspace_id: profile.workspace_id,
        key: 'kkiapay_secret_key',
        value: encrypt(body.kkiapay_secret_key)
      })
    }

    if (body.smtp_pass && !body.smtp_pass.includes('••••••••••••')) {
      recordsToUpsert.push({
        workspace_id: profile.workspace_id,
        key: 'smtp_pass',
        value: encrypt(body.smtp_pass)
      })
    }

    if (recordsToUpsert.length > 0) {
      const { error } = await supabaseAdmin
        .from('settings')
        .upsert(recordsToUpsert, { onConflict: 'workspace_id, key' })

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('API Secrets POST Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
