'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import {
    LayoutDashboard, Users, Wrench, FileText, PlusCircle,
    Percent, CreditCard, Settings, ChevronLeft, ChevronRight, Zap,
    Repeat, Receipt, UserCog, Bell, Shield, TrendingUp, ShieldCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/invoices', icon: FileText, label: 'nav.invoices' },
  { to: '/quotes', icon: FileText, label: 'Devis' },
  { to: '/invoices/new', icon: PlusCircle, label: 'nav.newInvoice', accent: true },
  { to: '/subscriptions', icon: Repeat, label: 'nav.subscriptions' },
  { to: '/expenses', icon: Receipt, label: 'nav.expenses', adminOnly: true },
  { to: '/clients', icon: Users, label: 'nav.clients' },
  { to: '/services', icon: Wrench, label: 'nav.services' },
  { to: '/tickets', icon: Zap, label: 'nav.tickets' },
  { to: '/reminders', icon: Bell, label: 'nav.reminders', adminOnly: true },
  { to: '/reports', icon: TrendingUp, label: 'nav.reports', adminOnly: true },
  { to: '/audit', icon: Shield, label: 'nav.audit', adminOnly: true },
  { to: '/discounts', icon: Percent, label: 'nav.discounts', adminOnly: true },
  { to: '/payments', icon: CreditCard, label: 'nav.payments' },
  { to: '/users', icon: UserCog, label: 'nav.users', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
  { to: '/superadmin', icon: ShieldCheck, label: 'Administration SaaS', superAdminOnly: true },
]

export function Sidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user } = useAuthStore()

  const filteredNavItems = navItems.filter(item => 
    (!item.adminOnly || user?.role === 'admin' || user?.role === 'superadmin') &&
    (!item.superAdminOnly || user?.role === 'superadmin')
  )

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col no-select"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-lg shadow-indigo-500/10 border border-border/50 bg-white p-1">
          <img src="/logo.ico" alt="Logo" className="w-full h-full object-cover rounded-full" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col overflow-hidden"
            >
              <span className="font-bold text-sidebar-foreground text-sm leading-tight">IT-Facture Web</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="px-1 py-0 h-4 text-[9px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/20">
                  SaaS V2.0
                </Badge>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredNavItems.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
          
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                item.accent && !sidebarCollapsed && 'bg-primary/10 text-primary hover:bg-primary/15',
                item.superAdminOnly && 'text-purple-500 hover:text-purple-600 hover:bg-purple-500/10'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full", item.superAdminOnly ? "bg-purple-500" : "bg-primary")}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn('w-5 h-5 flex-shrink-0', item.accent && 'text-primary', item.superAdminOnly && 'text-purple-500')} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.superAdminOnly ? item.label : t(item.label)}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom Actions */}
      <div className="p-2 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="flex-1 h-9 text-muted-foreground hover:bg-sidebar-accent">
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
        {!sidebarCollapsed && (
          <span className="text-[9px] font-medium text-muted-foreground/50 pr-2 select-none">
            CLOUD READY
          </span>
        )}
      </div>
    </motion.aside>
  )
}
