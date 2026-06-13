'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
      })

      if (error) {
        throw error
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl shadow-black/5"
      >
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la connexion
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Mot de passe oublié</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-6 bg-green-500/10 border border-green-500/20 rounded-xl"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-600 mb-2">E-mail envoyé !</h3>
            <p className="text-sm text-green-600/80 mb-6">
              Vérifiez votre boîte de réception pour {email}. Cliquez sur le lien fourni pour choisir un nouveau mot de passe.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
              Essayer avec une autre adresse
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.com"
                required
                autoFocus
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
