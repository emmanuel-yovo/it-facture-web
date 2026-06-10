'use client'

import React from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice } from '@/lib/repositories/invoice.repository'

interface InvoiceTemplateProps {
  invoice: Invoice
  settings: any
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ invoice, settings }, ref) => {
    const isQuote = invoice.document_type === 'quote'
    
    return (
      <div 
        ref={ref}
        className="bg-white text-black p-10 font-sans mx-auto"
        style={{
          width: '210mm',
          minHeight: '297mm',
          boxSizing: 'border-box',
          position: 'absolute',
          top: '-9999px', // Hide from view
          left: 0,
          zIndex: -1
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
            <div className="text-sm text-gray-600 space-y-1">
              <p>{settings?.company_address || 'Adresse non renseignée'}</p>
              <p>{settings?.company_phone}</p>
              <p>{settings?.company_email}</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold text-gray-800 uppercase tracking-wider mb-2">
              {isQuote ? 'Devis' : 'Facture'}
            </h1>
            <p className="text-lg font-semibold text-gray-600 mb-4">{invoice.invoice_number}</p>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Date :</span> {formatDate(invoice.created_at)}</p>
              <p><span className="text-gray-500">Échéance :</span> {invoice.due_date ? formatDate(invoice.due_date) : 'À réception'}</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-12">
          <div className="bg-gray-50 p-6 rounded-lg w-1/2 ml-auto">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Facturé à</p>
            <h2 className="text-lg font-bold text-gray-800">{(invoice as any).client?.full_name}</h2>
            {(invoice as any).client?.company_name && <p className="text-gray-600">{(invoice as any).client?.company_name}</p>}
            <p className="text-gray-600 mt-2">{(invoice as any).client?.address}</p>
            <p className="text-gray-600">{(invoice as any).client?.phone}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-800">
              <th className="py-3 text-left font-bold w-1/2">Description</th>
              <th className="py-3 text-center font-bold">Qté</th>
              <th className="py-3 text-right font-bold">Prix unitaire</th>
              <th className="py-3 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {((invoice as any).items || []).map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-4 text-left">
                  <p className="font-semibold text-gray-800">{item.service_name}</p>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </td>
                <td className="py-4 text-center text-gray-700">{item.quantity}</td>
                <td className="py-4 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                <td className="py-4 text-right font-semibold text-gray-800">{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-1/2 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total HT</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_total > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Remises</span>
                <span>-{formatCurrency(invoice.discount_total)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>TVA</span>
              <span>{formatCurrency(invoice.vat_total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 border-t-2 border-gray-800 pt-3 mt-3">
              <span>Total TTC</span>
              <span>{formatCurrency(invoice.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Footer (Signature & Notes) */}
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Notes</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes || 'Merci de votre confiance.'}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2 text-right">Signature</h3>
            <div className="h-24 border border-gray-200 rounded-lg flex items-center justify-center p-2">
              {invoice.signature_data ? (
                <img src={invoice.signature_data} alt="Signature Client" className="max-h-full" />
              ) : (
                <p className="text-gray-400 italic">Non signé</p>
              )}
            </div>
          </div>
        </div>

        {/* CGV */}
        {settings?.cgv_text && (
          <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-500 text-justify">
            <p>{settings.cgv_text}</p>
          </div>
        )}
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'
