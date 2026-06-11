'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { hasPermission, PERMISSIONS, Permission } from '@/lib/permissions'
import { canAccessFeature, PlanType } from '@/lib/limits'
import {
    LayoutDashboard, Users, Wrench, FileText, PlusCircle,
    Percent, CreditCard, Settings, ChevronLeft, ChevronRight, Zap,
    Repeat, Receipt, UserCog, Bell, Shield, TrendingUp, ShieldCheck, Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type NavItem = {
  to: string
  icon: any
  label: string
  accent?: boolean
  permission?: Permission
  feature?: string
}

export const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/invoices', icon: FileText, label: 'nav.invoices' },
  { to: '/quotes', icon: FileText, label: 'nav.quotes' },
  { to: '/invoices/new', icon: PlusCircle, label: 'nav.newInvoice', accent: true },
  { to: '/subscriptions', icon: Repeat, label: 'nav.subscriptions' },
  { to: '/expenses', icon: Receipt, label: 'nav.expenses', permission: PERMISSIONS.MANAGE_EXPENSES, feature: 'expenses' },
  { to: '/clients', icon: Users, label: 'nav.clients' },
  { to: '/services', icon: Wrench, label: 'nav.services' },
  { to: '/tickets', icon: Zap, label: 'nav.tickets', feature: 'tickets' },
  { to: '/reminders', icon: Bell, label: 'nav.reminders', permission: PERMISSIONS.MANAGE_REMINDERS },
  { to: '/reports', icon: TrendingUp, label: 'nav.reports', permission: PERMISSIONS.VIEW_REPORTS },
  { to: '/audit', icon: Shield, label: 'nav.audit', permission: PERMISSIONS.VIEW_AUDIT },
  { to: '/discounts', icon: Percent, label: 'nav.discounts', permission: PERMISSIONS.MANAGE_DISCOUNTS },
  { to: '/payments', icon: CreditCard, label: 'nav.payments' },
  { to: '/users', icon: UserCog, label: 'nav.users', permission: PERMISSIONS.MANAGE_USERS },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
  { to: '/superadmin', icon: ShieldCheck, label: 'nav.superadmin', permission: PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD },
]

export function Sidebar({ className }: { className?: string }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user, workspacePlan } = useAuthStore()
  const plan = (workspacePlan as PlanType) || 'free'

  const filteredNavItems = navItems.filter(item => 
    !item.permission || hasPermission(user?.role, item.permission)
  )

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn("h-screen bg-sidebar border-r border-sidebar-border flex flex-col no-select", className)}
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
              <div className="flex items-center gap-3 w-full">
                <span className="font-bold text-sidebar-foreground text-sm leading-tight">IT-Facture</span>
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
          const isLocked = item.feature ? !canAccessFeature(plan, item.feature as any, user?.role) : false
          
          return (
            <button
              key={item.to}
              onClick={() => router.push(isLocked ? '/upgrade' : item.to)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                item.accent && !sidebarCollapsed && 'bg-primary/10 text-primary hover:bg-primary/15',
                item.permission === PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD && 'text-purple-500 hover:text-purple-600 hover:bg-purple-500/10'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full", item.permission === PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD ? "bg-purple-500" : "bg-primary")}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className="flex items-center gap-3">
                <item.icon className={cn('w-5 h-5 flex-shrink-0', item.accent && 'text-primary', item.permission === PERMISSIONS.VIEW_SUPERADMIN_DASHBOARD && 'text-purple-500')} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {t(item.label)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {!sidebarCollapsed && isLocked && (
                <Lock className="w-4 h-4 text-muted-foreground/60 ml-auto" />
              )}
            </button>
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
