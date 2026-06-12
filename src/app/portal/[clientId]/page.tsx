import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Building2, Mail, Phone, Calendar, ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Portail Client',
}

export default async function ClientPortalPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params
  const clientId = resolvedParams.clientId

  if (!clientId || clientId.length < 30) {
    notFound()
  }

  // 1. Fetch Client using Admin Client (Bypass RLS)
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // 2. Fetch Workspace Settings
  const { data: settingsData } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .eq('workspace_id', client.workspace_id)

  const settings: any = {}
  settingsData?.forEach(row => {
    settings[row.key] = row.value
  })

  // 3. Fetch Invoices and Quotes
  const { data: documents } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, document_type, grand_total, status, due_date, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  const invoices = documents?.filter(d => d.document_type === 'invoice') || []
  const quotes = documents?.filter(d => d.document_type === 'quote') || []

  // Calculs
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'partial')
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0)
  
  const companyName = settings.company_name || 'IT-Facture'

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'quote') {
      switch(status) {
        case 'draft': return <Badge variant="outline" className="bg-slate-100 text-slate-700">En attente</Badge>
        case 'accepted': return <Badge variant="success" className="bg-emerald-500 text-white">Accepté</Badge>
        case 'rejected': return <Badge variant="destructive" className="bg-red-500 text-white">Refusé</Badge>
        default: return <Badge variant="outline">{status}</Badge>
      }
    } else {
      switch(status) {
        case 'paid': return <Badge variant="success" className="bg-emerald-500 text-white"><CheckCircle2 className="w-3 h-3 mr-1"/> Payée</Badge>
        case 'partial': return <Badge variant="warning" className="bg-amber-500 text-white"><Clock className="w-3 h-3 mr-1"/> Partielle</Badge>
        case 'unpaid': return <Badge variant="destructive" className="bg-red-500 text-white"><AlertCircle className="w-3 h-3 mr-1"/> Non payée</Badge>
        default: return <Badge variant="outline">{status}</Badge>
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.company_logo ? (
              <img src={settings.company_logo} alt={companyName} className="h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-sm">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-lg text-slate-900 hidden sm:block">{companyName}</span>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Portail sécurisé
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* WELCOME SECTION */}
        <section className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Bonjour, {client.full_name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Bienvenue sur votre espace client dédié. Retrouvez ici tous vos documents financiers.
            </p>
          </div>
          
          {totalUnpaid > 0 && (
            <Card className="bg-white border-red-100 shadow-sm md:min-w-[250px]">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Reste à payer</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalUnpaid)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* INFO CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" /> Informations Prestataire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{companyName}</p>
              {settings.company_email && <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {settings.company_email}</p>}
              {settings.company_phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /> {settings.company_phone}</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" /> Vos informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{client.full_name}</p>
              {client.company_name && <p className="text-muted-foreground">{client.company_name}</p>}
              {client.email && <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {client.email}</p>}
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
            <TabsTrigger value="quotes">Devis ({quotes.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices" className="mt-6">
            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-500">N° Facture</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Date</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Montant</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Statut</th>
                      <th className="px-6 py-4 font-medium text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Aucune facture trouvée.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{inv.invoice_number}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatDate(inv.created_at)}</td>
                          <td className="px-6 py-4 font-semibold">{formatCurrency(inv.grand_total)}</td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status, 'invoice')}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/portal/${clientId}/invoice/${inv.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                Voir <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            <Card className="shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 font-medium text-slate-500">N° Devis</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Date</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Montant</th>
                      <th className="px-6 py-4 font-medium text-slate-500">Statut</th>
                      <th className="px-6 py-4 font-medium text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {quotes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Aucun devis trouvé.
                        </td>
                      </tr>
                    ) : (
                      quotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium">{quote.invoice_number}</td>
                          <td className="px-6 py-4 text-muted-foreground">{formatDate(quote.created_at)}</td>
                          <td className="px-6 py-4 font-semibold">{formatCurrency(quote.grand_total)}</td>
                          <td className="px-6 py-4">{getStatusBadge(quote.status, 'quote')}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/portal/${clientId}/invoice/${quote.id}`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                Voir <ArrowRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  )
}
