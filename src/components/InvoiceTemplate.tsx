'use client'

import React from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice } from '@/lib/repositories/invoice.repository'

interface InvoiceTemplateProps {
  invoice: Invoice
  settings: any
  plan?: string
  preview?: boolean
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, settings, plan = 'free', preview = false }, ref) => {
    const isQuote = invoice.document_type === 'quote'
    
    return (
      <div 
        ref={ref}
        className={`p-10 font-sans mx-auto ${preview ? 'relative shadow-xl rounded-sm' : ''}`}
        style={{
          backgroundColor: '#ffffff',
          color: '#000000',
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          position: preview ? 'relative' : 'absolute',
          top: preview ? '0' : '-9999px',
          left: 0,
          zIndex: preview ? 1 : -1,
          transform: preview ? 'scale(0.9) sm:scale(1)' : 'none',
          transformOrigin: 'top center'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            {settings?.company_logo ? (
              <img src={settings.company_logo} alt="Logo" className="h-16 object-contain mb-4" />
            ) : (
              <div className="text-2xl font-bold mb-4">{settings?.company_name || 'Votre Entreprise'}</div>
            )}
            <div className="text-sm space-y-1" style={{ color: '#4b5563' }}>
              <p>{settings?.company_address || 'Adresse non renseignée'}</p>
              <p>{settings?.company_phone}</p>
              <p>{settings?.company_email}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold uppercase tracking-wider mb-2" style={{ color: '#1f2937' }}>
              {isQuote ? 'Devis' : 'Facture'}
            </h1>
            <p className="text-lg font-semibold mb-4" style={{ color: '#4b5563' }}>{invoice.invoice_number}</p>
            <div className="text-sm space-y-1">
              <p><span style={{ color: '#6b7280' }}>Date :</span> {formatDate(invoice.created_at)}</p>
              <p><span style={{ color: '#6b7280' }}>Échéance :</span> {invoice.due_date ? formatDate(invoice.due_date) : 'À réception'}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-12">
          <div className="p-6 rounded-lg w-1/2 ml-auto" style={{ backgroundColor: '#f9fafb' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#6b7280' }}>Facturé à</p>
            <h2 className="text-lg font-bold" style={{ color: '#1f2937' }}>{(invoice as any).client?.full_name}</h2>
            {(invoice as any).client?.company_name && <p style={{ color: '#4b5563' }}>{(invoice as any).client?.company_name}</p>}
            <p className="mt-2" style={{ color: '#4b5563' }}>{(invoice as any).client?.address}</p>
            <p style={{ color: '#4b5563' }}>{(invoice as any).client?.phone}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2" style={{ borderColor: '#1f2937', color: '#1f2937' }}>
              <th className="py-3 text-left font-bold w-1/2">Description</th>
              <th className="py-3 text-center font-bold">Qté</th>
              <th className="py-3 text-right font-bold">Prix unitaire</th>
              <th className="py-3 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {((invoice as any).items || []).map((item: any, i: number) => (
              <tr key={i} className="border-b" style={{ borderColor: '#e5e7eb' }}>
                <td className="py-4 text-left">
                  <p className="font-semibold" style={{ color: '#1f2937' }}>{item.service_name}</p>
                  {item.description && <p className="text-xs mt-1" style={{ color: '#6b7280' }}>{item.description}</p>}
                </td>
                <td className="py-4 text-center" style={{ color: '#374151' }}>{item.quantity}</td>
                <td className="py-4 text-right" style={{ color: '#374151' }}>{formatCurrency(item.unit_price)}</td>
                <td className="py-4 text-right font-semibold" style={{ color: '#1f2937' }}>{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2 space-y-3 text-sm">
            <div className="flex justify-between" style={{ color: '#4b5563' }}>
              <span>Sous-total HT</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between" style={{ color: '#ef4444' }}>
                <span>Remises</span>
                <span>-{formatCurrency(invoice.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between" style={{ color: '#4b5563' }}>
              <span>TVA</span>
              <span>{formatCurrency(invoice.vat_total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t-2 pt-3 mt-3" style={{ color: '#1f2937', borderColor: '#1f2937' }}>
              <span>Total TTC</span>
              <span>{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer (Signature & Notes) */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold mb-2" style={{ color: '#1f2937' }}>Notes</h3>
            <p className="whitespace-pre-wrap" style={{ color: '#4b5563' }}>{invoice.notes || 'Merci de votre confiance.'}</p>
          </div>
          <div>
            <h3 className="font-bold mb-2 text-right" style={{ color: '#1f2937' }}>Signature & Cachet</h3>
            <div className="flex flex-col items-end justify-center p-2 min-h-[96px]">
              {settings?.signature ? (
                <img src={settings.signature} alt="Signature" className="max-h-20 mb-2 object-contain" />
              ) : null}
              {settings?.stamp ? (
                <img src={settings.stamp} alt="Cachet" className="max-h-24 object-contain" />
              ) : null}
              {!settings?.signature && !settings?.stamp && (
                <p className="italic" style={{ color: '#9ca3af' }}>Non signé</p>
              )}
            </div>
          </div>
        </div>

        {/* CGV */}
        {settings?.cgv_text && (
          <div className="mt-16 pt-8 border-t text-xs text-justify" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>
            <p>{settings.cgv_text}</p>
          </div>
        )}

        {/* Watermark pour le plan Gratuit */}
        {plan === 'free' && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[10px]" style={{ color: '#9ca3af' }}>
              Généré gratuitement avec <span className="font-bold">IT-Facture.com</span> - Créez vos factures simplement.
            </p>
          </div>
        )}
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'
