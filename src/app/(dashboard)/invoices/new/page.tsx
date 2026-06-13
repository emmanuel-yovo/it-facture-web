'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatCurrencyByCountry } from '@/lib/utils'
import { Search, Plus, Minus, ChevronRight, ChevronLeft, Check, FileText, User, Wrench, Percent, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clientRepository } from '@/lib/repositories/client.repository'
import { serviceRepository } from '@/lib/repositories/service.repository'
import { discountRepository } from '@/lib/repositories/discount.repository'
import { settingsRepository } from '@/lib/repositories/settings.repository'
import { invoiceRepository } from '@/lib/repositories/invoice.repository'
import { useTranslation } from 'react-i18next'

interface SelectedItem { service_id?: string; service_name: string; description?: string; quantity: number; unit_price: number; vat_percentage: number; discount_id?: string; discount_value: number }

const steps = ['selectClient', 'selectServices', 'applyDiscounts', 'review']

function InvoiceForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const docType = searchParams.get('type') === 'quote' ? 'quote' : 'invoice'
  
  const { workspaceId, agencyId } = useAuthStore()
  const [step, setStep] = useState(0)
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [globalDiscount, setGlobalDiscount] = useState<any>(null)
  const [globalDiscountValue, setGlobalDiscountValue] = useState(0)
  const [promoCode, setPromoCode] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<any>({})

  useEffect(() => {
    if (!workspaceId) return
    clientRepository.getAll({ workspace_id: workspaceId, page: 1, pageSize: 200 }).then(r => setClients(r.data))
    serviceRepository.getAll({ workspace_id: workspaceId, page: 1, pageSize: 200 }).then(r => setServices(r.data))
    settingsRepository.getSettings(workspaceId).then(setSettings)
  }, [workspaceId])

  const filteredClients = clients.filter(c => c.full_name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.company_name || '').toLowerCase().includes(clientSearch.toLowerCase()))
  const filteredServices = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))

  const formatVal = (amount: number) => {
    return formatCurrency(amount)
  }

  const taxLabel = settings?.company_country === 'US' ? 'Sales Tax' : 'TVA'

  const isClientExempt = selectedClient && settings?.company_country && (
    (settings.company_country === 'FR' && selectedClient.country !== 'FR') ||
    (['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'].includes(settings.company_country) && 
     !['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG'].includes(selectedClient.country))
  )

  const toggleService = (s: any) => {
    const exists = selectedItems.find(i => i.service_id === s.id)
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.service_id !== s.id))
    } else {
      const vat_percentage = isClientExempt ? 0 : s.vat_percentage
      setSelectedItems([...selectedItems, { service_id: s.id, service_name: s.name, description: s.description, quantity: 1, unit_price: s.unit_price, vat_percentage, discount_id: undefined, discount_value: 0 }])
    }
  }

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...selectedItems]
    ;(items[idx] as any)[field] = value
    setSelectedItems(items)
  }

  const subtotal = selectedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const itemDiscounts = selectedItems.reduce((sum, i) => sum + i.discount_value, 0)
  const vatTotal = selectedItems.reduce((sum, i) => {
    const lineAfterDiscount = i.unit_price * i.quantity - i.discount_value
    return sum + Math.round(lineAfterDiscount * (i.vat_percentage / 100))
  }, 0)
  const totalDiscounts = itemDiscounts + globalDiscountValue
  const grandTotal = subtotal + vatTotal - totalDiscounts

  const applyPromo = async () => {
    if (!promoCode || !workspaceId) return
    try {
      const d = await discountRepository.getByPromoCode(promoCode, workspaceId)
      if (d) {
        setGlobalDiscount(d)
        if (d.type === 'percentage') {
          setGlobalDiscountValue(Math.round(subtotal * d.value / 100))
        } else {
          setGlobalDiscountValue(d.value)
        }
      } else {
        alert(t("invoices.invalidPromo", "Code promo invalide ou expiré."))
      }
    } catch (err) {
      alert(t("invoices.errorPromo", "Erreur lors de la validation du code promo."))
    }
  }

  const handleSave = async () => {
    if (!selectedClient || selectedItems.length === 0 || !workspaceId) return
    setSaving(true)
    try {
      const invoice = await invoiceRepository.create(workspaceId, {
        client_id: selectedClient.id,
        agency_id: agencyId || null,
        items: selectedItems.map(i => ({ ...i, description: i.description || undefined, discount_id: i.discount_id || undefined })),
        global_discount_id: globalDiscount?.id || undefined,
        global_discount_value: globalDiscountValue,
        notes: notes || undefined,
        due_date: undefined,
        status: docType === 'quote' ? 'draft' : 'unpaid',
        document_type: docType
      })
      router.push(`/invoices/${invoice.id}`)
    } catch (e) {
      console.error(e)
      alert(t("invoices.createError", "Erreur lors de la création"))
    } finally { setSaving(false) }
  }

  const stepIcons = [User, Wrench, Percent, FileText]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
            <h1 className="text-2xl font-bold">{docType === 'quote' ? t('nav.quotes') : t('invoices.newInvoice')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('invoices.step')} {step + 1} {t('common.of')} 4</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground hidden sm:flex">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-2 transition-colors ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={i === step ? 'text-foreground font-medium' : ''}>{t(`invoices.${s}`, s)}</span>
                {i < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-2 opacity-50" />}
              </div>
            ))}
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader><CardTitle>{t("invoices.selectClient", "Sélectionner le client")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={t("clients.search", "Rechercher un client...")} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10" /></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredClients.map(c => (
                        <div key={c.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedClient?.id === c.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => setSelectedClient(c)}>
                          <div className="flex justify-between items-start">
                            <div><p className="font-medium">{c.full_name}</p><p className="text-xs text-muted-foreground">{c.company_name || c.email || c.phone} {c.country ? `(${c.country})` : ''}</p></div>
                            {selectedClient?.id === c.id && <Check className="w-5 h-5 text-primary" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isClientExempt && (
                      <div className="flex items-start gap-2.5 p-3.5 mt-4 text-amber-500 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">{t("invoices.clientExempt", "Client exonéré / Hors taxe")}</p>
                          <p className="text-xs text-amber-500/80 mt-1">
                            {t("invoices.exemptDesc1", "Ce client est enregistré dans un pays différent")} ({selectedClient.country}) {t("invoices.exemptDesc2", "de votre entreprise")} ({settings?.company_country || 'FR'}). 
                            Le taux de taxe ({taxLabel}) sera automatiquement initialisé à 0% conformément aux règles d&apos;exportation / autoliquidation.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader><CardTitle>{t("invoices.selectServices", "Sélectionner les services")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder={t("services.search", "Rechercher un service...")} value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className="pl-10" /></div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {filteredServices.map(s => {
                        const isSelected = selectedItems.some(i => i.service_id === s.id)
                        const itemIdx = selectedItems.findIndex(i => i.service_id === s.id)
                        return (
                          <div key={s.id} className={`p-3 rounded-lg border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                            <div className="flex items-start gap-3">
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleService(s)} className="mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between"><p className="font-medium">{s.name}</p><Badge variant="secondary" className="ml-2">{s.category}</Badge></div>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                                <p className="text-sm font-medium text-primary mt-1">{formatVal(s.unit_price)}</p>
                              </div>
                            </div>
                            {isSelected && itemIdx >= 0 && (
                              <div className="mt-3 flex items-center gap-4 pl-7">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Qté</Label>
                                  <div className="flex items-center">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItem(itemIdx, 'quantity', Math.max(1, selectedItems[itemIdx].quantity - 1))}><Minus className="w-3 h-3" /></Button>
                                    <Input type="number" min="1" className="w-16 h-7 text-center mx-1" value={selectedItems[itemIdx].quantity} onChange={(e) => updateItem(itemIdx, 'quantity', Math.max(1, Number(e.target.value)))} />
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItem(itemIdx, 'quantity', selectedItems[itemIdx].quantity + 1)}><Plus className="w-3 h-3" /></Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">Prix</Label>
                                  <Input type="number" min="0" className="w-28 h-7" value={selectedItems[itemIdx].unit_price} onChange={(e) => updateItem(itemIdx, 'unit_price', Math.max(0, Number(e.target.value)))} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs">{taxLabel} %</Label>
                                  <Input type="number" min="0" step="0.01" className="w-20 h-7" value={selectedItems[itemIdx].vat_percentage} onChange={(e) => updateItem(itemIdx, 'vat_percentage', Math.max(0, Number(e.target.value)))} />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader><CardTitle>Remises & Notes</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Code promo global</Label>
                      <div className="flex gap-2"><Input placeholder="EX: PROMO10" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} /><Button onClick={applyPromo}>Appliquer</Button></div>
                      {globalDiscount && <p className="text-sm text-emerald-500">✓ {globalDiscount.name} — Remise: {formatVal(globalDiscountValue)}</p>}
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Remises par ligne de service</Label>
                      {selectedItems.map((item, idx) => (
                        <div key={item.service_id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                          <p className="flex-1 text-sm">{item.service_name}</p>
                          <Input type="number" className="w-32 h-8" placeholder={`Remise`} value={item.discount_value || ''} onChange={(e) => updateItem(idx, 'discount_value', Number(e.target.value))} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2"><Label>Notes additionnelles (affichées sur la facture)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Merci pour votre confiance..." rows={3} /></div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card>
                  <CardHeader><CardTitle>Vérification</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium">{selectedClient?.full_name}</p>
                      {selectedClient?.company_name && <p className="text-sm text-muted-foreground">{selectedClient.company_name}</p>}
                    </div>
                    {/* Desktop View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b"><th className="text-left py-2">Service</th><th className="text-center py-2">Qté</th><th className="text-right py-2">Prix unitaire</th><th className="text-right py-2">Total Ligne</th></tr></thead>
                        <tbody>
                          {selectedItems.map(item => (
                            <tr key={item.service_id} className="border-b border-border/50">
                              <td className="py-2">{item.service_name}</td>
                              <td className="py-2 text-center">{item.quantity}</td>
                              <td className="py-2 text-right">{formatVal(item.unit_price)}</td>
                              <td className="py-2 text-right font-medium">{formatVal(item.unit_price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View */}
                    <div className="sm:hidden space-y-3">
                      {selectedItems.map(item => (
                        <div key={item.service_id} className="p-3 bg-muted/20 border border-border/50 rounded-lg">
                          <p className="font-semibold text-sm">{item.service_name}</p>
                          <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                            <span>{item.quantity} x {formatVal(item.unit_price)}</span>
                            <span className="font-bold text-foreground">{formatVal(item.unit_price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}><ChevronLeft className="w-4 h-4 mr-2" />{t('invoices.previous')}</Button>
            {step < 3 ? (
              <Button onClick={() => { if (step === 0 && !selectedClient) return; if (step === 1 && selectedItems.length === 0) return; setStep(s => s + 1) }}>
                {t('invoices.next')} <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving || !selectedClient || selectedItems.length === 0} className="shadow-lg shadow-primary/20">
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4 mr-2" />{docType === 'quote' ? t('common.save') : t('invoices.generate')}</>}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:block mt-8 lg:mt-0">
          <Card className="sticky top-6">
            <CardHeader><CardTitle className="text-base">{t("invoices.quickPreview", "Aperçu rapide")}</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-bold text-primary text-sm">IT-Facture</p>
                <p className="text-muted-foreground mt-1">{settings?.company_name || 'IT Solutions'}</p>
              </div>
              {selectedClient && (
                <div><p className="text-muted-foreground">Client:</p><p className="font-medium">{selectedClient.full_name}</p></div>
              )}
              <Separator />
              {selectedItems.length > 0 ? (
                <div className="space-y-1">
                  {selectedItems.map(item => (
                    <div key={item.service_id} className="flex justify-between">
                      <span className="truncate mr-2">{item.service_name} x{item.quantity}</span>
                      <span className="font-medium whitespace-nowrap">{formatVal(item.unit_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-center py-3">{t("invoices.noServicesSelected", "Aucun service sélectionné")}</p>}
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between"><span>{t("invoices.subtotalHT", "Sous-total HT")}</span><span>{formatVal(subtotal)}</span></div>
                <div className="flex justify-between"><span>{taxLabel}</span><span>{formatVal(vatTotal)}</span></div>
                {totalDiscounts > 0 && <div className="flex justify-between text-red-400"><span>{t("nav.discounts", "Remises")}</span><span>-{formatVal(totalDiscounts)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-base"><span>{t("invoices.totalTTC", "Total TTC")}</span><span className="text-primary">{formatVal(grandTotal)}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Chargement...</div>}>
      <InvoiceForm />
    </Suspense>
  )
}
