import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  const country = typeof window !== 'undefined' ? localStorage.getItem('company_country') || 'FR' : 'FR'
  const symbol = typeof window !== 'undefined' ? localStorage.getItem('currency_symbol') || 'FCFA' : 'FCFA'
  
  const UEMOA_COUNTRIES = ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']
  const isUemoa = UEMOA_COUNTRIES.includes(country) || ['FCFA', 'XOF', 'XAF'].includes(symbol)
  
  if (isUemoa) {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount)).replace(/[\s\u202F\u00A0]/g, ' ') + ' ' + symbol
  } else if (country === 'US' || symbol === '$' || symbol === 'USD') {
    return '$' + new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  } else {
    const formatted = new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace(/[\s\u202F\u00A0]/g, ' ')
    return `${formatted} ${symbol}`
  }
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'unpaid': return 'bg-red-500/10 text-red-500 border-red-500/20'
    case 'partial': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'paid': return 'Payée'
    case 'unpaid': return 'Non payée'
    case 'partial': return 'Partielle'
    default: return status
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

const UEMOA_COUNTRIES = ['BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']

export function formatCurrencyByCountry(amount: number, country: string = 'FR', currencySymbol?: string): string {
  let symbol = currencySymbol
  if (!symbol) {
    if (country === 'US') symbol = '$'
    else if (UEMOA_COUNTRIES.includes(country)) symbol = 'FCFA'
    else symbol = '€'
  }

  const isUemoa = UEMOA_COUNTRIES.includes(country) || ['FCFA', 'XOF', 'XAF'].includes(symbol)
  if (isUemoa) {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount)).replace(/[\s\u202F\u00A0]/g, ' ') + ' ' + symbol
  } else if (country === 'US' || symbol === '$' || symbol === 'USD') {
    return '$' + new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  } else {
    const formatted = new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount).replace(/[\s\u202F\u00A0]/g, ' ')
    return `${formatted} ${symbol}`
  }
}

