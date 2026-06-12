'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const [user, setLocalUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser, setWorkspaceId, setWorkspacePlan, setSubscriptionEndDate } = useAuthStore()

  useEffect(() => {
    // Obtenir la session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setLocalUser(session.user)
        fetchProfileAndWorkspace(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Écouter les changements d'état (connexion, déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setLocalUser(session.user)
          fetchProfileAndWorkspace(session.user.id)
        } else {
          setLocalUser(null)
          setUser(null)
          setWorkspaceId(null)
          setWorkspacePlan(null)
          setSubscriptionEndDate(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfileAndWorkspace(userId: string) {
    try {
      // 1. Récupérer le profil et le plan du workspace
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, workspaces(plan, subscription_end_date)')
        .eq('id', userId)
        .single()

      if (profile) {
        setUser({
          id: profile.id,
          username: profile.full_name, // fallback pour l'ancien modèle
          full_name: profile.full_name,
          role: profile.role,
        } as any)
        
        if (profile.workspace_id) {
          setWorkspaceId(profile.workspace_id)
          // Le join avec workspaces retourne un objet si on le récupère
          if (profile.workspaces && typeof profile.workspaces === 'object') {
            let currentPlan = (profile.workspaces as any).plan || 'free'
            const endDateStr = (profile.workspaces as any).subscription_end_date
            
            if (currentPlan !== 'free' && endDateStr) {
              const endDate = new Date(endDateStr)
              if (endDate < new Date()) {
                currentPlan = 'free' // Abonnement expiré, on repasse en free !
              }
            }
            
            setWorkspacePlan(currentPlan)
            setSubscriptionEndDate(endDateStr || null)
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      setLoading(false)
    }
  }

  return { user, loading }
}
