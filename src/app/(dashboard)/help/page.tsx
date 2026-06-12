'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { LifeBuoy, FileText, Settings, Users, CreditCard, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function HelpPage() {
  const { t } = useTranslation()

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-4xl mx-auto">
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Centre d'Aide & Tutoriels</h1>
        </div>
        <p className="text-muted-foreground text-lg">Retrouvez ici toutes les informations pour maîtriser IT-Facture de A à Z.</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Guides */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              Guides Rapides
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Comment créer ma première facture ?</h3>
              <p className="text-sm text-muted-foreground">
                Allez dans l'onglet "Factures" et cliquez sur le bouton "Nouvelle Facture". Sélectionnez un client existant (ou créez-en un nouveau), ajoutez vos services, et cliquez sur "Enregistrer".
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Comment importer mes clients depuis Excel ?</h3>
              <p className="text-sm text-muted-foreground">
                Sur la page "Clients", utilisez le bouton "Importer CSV". Vous pouvez télécharger le modèle vide pour voir exactement quelles colonnes remplir avant d'importer votre fichier.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Puis-je changer la devise (FCFA, Euro, Dollar) ?</h3>
              <p className="text-sm text-muted-foreground">
                Oui, rendez-vous dans l'onglet "Paramètres" (dans le menu latéral ou en haut à droite). Vous pourrez y configurer votre pays et la devise qui s'affichera sur vos factures.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configurations */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-emerald-500" />
              Configuration Avancée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Ajouter un logo et un cachet</h3>
              <p className="text-sm text-muted-foreground">
                Dans les Paramètres, section "Entreprise", vous pouvez télécharger votre logo, un cachet (tampon) et même une signature numérique qui s'ajouteront automatiquement sur tous vos PDF.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Envoi automatique par Email (SMTP)</h3>
              <p className="text-sm text-muted-foreground">
                Pour envoyer vos factures directement depuis l'application, configurez votre serveur SMTP dans les paramètres (onglet Emails). Utilisez un "Mot de passe d'application" si vous utilisez Gmail.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Inviter des collaborateurs</h3>
              <p className="text-sm text-muted-foreground">
                Dans les Paramètres, vous trouverez votre "Identifiant d'entreprise" (Company ID). Donnez ce code à vos employés pour qu'ils rejoignent votre espace de travail en créant leur compte.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={item}>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Foire Aux Questions (FAQ)</CardTitle>
            <CardDescription>Les questions les plus courantes de nos utilisateurs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left font-medium">Comment fonctionnent les paiements en ligne (FedaPay) ?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  IT-Facture s'intègre avec FedaPay pour vous permettre de recevoir des paiements par Mobile Money et carte bancaire.
                  Pour l'activer, allez dans les Paramètres > FedaPay, et entrez vos clés secrètes disponibles sur votre compte développeur FedaPay.
                  Une fois configuré, un bouton "Payer" apparaîtra sur la version électronique de vos factures pour vos clients.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left font-medium">Puis-je faire des factures récurrentes (abonnements) ?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Oui ! Le module "Abonnements" vous permet de lier un client à une facture récurrente (mensuelle ou annuelle). Le système pourra automatiquement relancer le client lorsque la date d'échéance approche.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left font-medium">À quoi sert le module "Tickets" ?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Les tickets vous permettent de suivre le support client ou les petites tâches pour un client (ex: réparation, maintenance).
                  Vous pouvez enregistrer le temps passé sur chaque ticket, puis les transformer directement en facture pour facturer vos heures de travail !
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left font-medium">Mes données sont-elles sécurisées ?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Absolument. Chaque espace de travail est hermétiquement isolé. Même si vous invitez des collaborateurs, vous gardez le contrôle total (rôle Administrateur) et vous pouvez révoquer leurs accès à tout moment. Si vous supprimez votre compte, toutes vos données sont définitivement effacées de nos serveurs.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
