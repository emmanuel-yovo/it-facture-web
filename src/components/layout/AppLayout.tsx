'use client'

import { useEffect, useState } from 'react'
import '@/i18n'
import { Sidebar } from './Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Languages, Sun, Moon, Sparkles, Menu, X, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useAppStore()
  const { user } = useAuthStore()
  const { loading } = useAuth()
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  const setLang = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  if (!mounted) {
    return <div className="h-screen w-screen bg-background" />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" layoutIdPrefix="desktop-" />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-50 flex shadow-2xl"
              onClick={(e) => {
                // Si on clique sur un lien, on veut fermer le menu
                if ((e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).tagName === 'A') {
                  // Petit délai pour laisser l'animation de clic se faire
                  setTimeout(() => setMobileMenuOpen(false), 100)
                }
              }}
            >
              <Sidebar className="flex" layoutIdPrefix="mobile-" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-muted-foreground hover:bg-muted" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-sm z-30 relative">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Upgrade Button */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => router.push('/upgrade')}
              className="hidden sm:flex h-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md shadow-orange-500/20"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Tarifs & Plans
            </Button>

            <div className="flex items-center gap-2 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  >
                    <Languages className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{i18n?.resolvedLanguage || 'fr'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => setLang('fr')} className={cn("flex items-center justify-between", i18n?.resolvedLanguage === 'fr' && "bg-indigo-500/10 text-indigo-500 font-bold")}>
                    Français <span>🇫🇷</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang('en')} className={cn("flex items-center justify-between", i18n?.resolvedLanguage === 'en' && "bg-indigo-500/10 text-indigo-500 font-bold")}>
                    English <span>🇺🇸</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-muted/50 p-1.5 pr-2 rounded-full transition-colors text-left focus:outline-none cursor-pointer border-0 bg-transparent">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium leading-none mb-1">{user?.full_name || 'Utilisateur'}</p>
                  <p className="text-[11px] text-muted-foreground capitalize leading-none">{user?.role || 'user'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {String(user?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 mt-1">
                <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer py-2 px-3 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>{t('nav.settings')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
