'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Check auth state immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCheckingAuth(false)
      if (session) {
        handleAcceptInvite(session.access_token)
      }
    })
  }, [token])

  const handleAcceptInvite = async (accessToken: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'acceptation de l'invitation")
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/' // Force reload to refresh auth state
      }, 2000)

    } catch (err: any) {
      console.error(err)
      setError(err.message)
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, l'inviter à se connecter/inscrire
  if (!user && !loading && !success && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-xl text-center"
        >
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Invitation en attente</h1>
          <p className="text-muted-foreground mb-8">
            Vous devez être connecté pour accepter cette invitation.
          </p>
          <div className="space-y-3">
            <Link href={`/login?next=/invite/${token}`}>
              <Button className="w-full h-11">Se connecter</Button>
            </Link>
            <Link href={`/register?next=/invite/${token}`}>
              <Button variant="outline" className="w-full h-11">Créer un compte</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border rounded-2xl p-8 shadow-xl relative z-10 text-center"
      >
        {loading ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <h2 className="text-xl font-medium">Validation de l'invitation...</h2>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-600">Bienvenue dans l'équipe !</h2>
            <p className="text-muted-foreground">Vous allez être redirigé vers votre espace de travail...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-4 text-red-600">Invitation non valide</h2>
            <p className="text-muted-foreground mb-8">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Retour à l'accueil
            </Button>
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}
