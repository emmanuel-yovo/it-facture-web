'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'

export function WorkspaceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, workspaceId } = useAuthStore()
  const { loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || loading) return

    // Si on est connecté mais qu'on n'a pas de workspace, on force l'onboarding
    if (user && !workspaceId && pathname !== '/onboarding') {
      router.push('/onboarding')
    }
  }, [mounted, loading, user, workspaceId, pathname, router])

  // Ne pas afficher le contenu si ça charge, ou si pas de workspace (pour éviter les clignotements/crash)
  if (!mounted || loading) {
    return <div className="h-screen w-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  }

  // S'il n'y a pas de workspace et qu'on n'est pas sur la page d'onboarding (redirection en cours), on masque
  if (user && !workspaceId && pathname !== '/onboarding') {
    return <div className="h-screen w-screen bg-background" />
  }

  return <>{children}</>
}
