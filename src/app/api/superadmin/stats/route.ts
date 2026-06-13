import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    
    const token = authHeader.replace('Bearer ', '')

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

    // 3. Initialiser le client Admin pour contourner le RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 4. Fetch all workspaces
    const { data: workspaces, error: workspacesError } = await supabaseAdmin
      .from('workspaces')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false })

    if (workspacesError) throw workspacesError

    // 5. Fetch global invoice count
    const { count: invoicesCount, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    if (invoicesError) throw invoicesError

    // 6. Fetch invoices per workspace for stats
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('workspace_id, grand_total, status')

    const statsByWorkspace = (workspaces || []).map(w => {
      const workspaceInvoices = (invoices || []).filter(i => i.workspace_id === w.id)
      const totalRevenue = workspaceInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.grand_total), 0)
      
      const owner = w.profiles?.find((p: any) => p.role === 'admin') || w.profiles?.[0] || null

      return {
        ...w,
        owner,
        invoiceCount: workspaceInvoices.length,
        totalRevenue
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalWorkspaces: workspaces?.length || 0,
        totalInvoices: invoicesCount || 0,
        workspaces: statsByWorkspace
      }
    })

  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 })
  }
}
