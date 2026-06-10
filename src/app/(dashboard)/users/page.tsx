'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ExternalLink, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function UsersPage() {
  const { user } = useAuthStore()

  if (user?.role !== 'admin') {
    return <div className="p-12 text-center text-muted-foreground"><p>Accès restreint aux administrateurs.</p></div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" /> Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">Gestion des accès et des rôles.</p>
        </div>
      </div>

      <Card className="max-w-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Sécurité Renforcée
          </CardTitle>
          <CardDescription>
            Dans cette nouvelle version Cloud de IT-Facture, la gestion des utilisateurs est sécurisée par Supabase Auth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Pour garantir une sécurité maximale et le respect des normes (RGPD), la création d'utilisateurs, la réinitialisation des mots de passe et la gestion des rôles ont été centralisées sur le dashboard d'administration cloud.
          </p>
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
            <ul className="list-disc pl-5 space-y-2 text-foreground/80">
              <li>Invitez de nouveaux collaborateurs par email</li>
              <li>Attribuez des rôles (Admin, Utilisateur)</li>
              <li>Gérez les accès Multi-Tenants (Workspaces)</li>
              <li>Authentification sécurisée (MFA disponible)</li>
            </ul>
          </div>
          <div className="pt-4">
            <Button onClick={() => window.open('https://supabase.com/dashboard', '_blank')} className="bg-primary text-white">
              <ExternalLink className="w-4 h-4 mr-2" /> Ouvrir le gestionnaire d'accès Cloud
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
