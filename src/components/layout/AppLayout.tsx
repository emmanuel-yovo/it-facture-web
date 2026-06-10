'use client'

import { Sidebar } from './Sidebar'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Languages, Sun, Moon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useAppStore()
  const { user } = useAuthStore()
  const { i18n } = useTranslation()

  const setLang = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm">
          <div />
          <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.full_name || 'Utilisateur'}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{user?.role || 'user'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {(user?.full_name?.charAt(0) || 'U').toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
