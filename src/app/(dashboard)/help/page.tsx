'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LifeBuoy, FileText, Settings, Users, CreditCard, Mail, Rocket, Shield, Receipt, Repeat, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function HelpPage() {
  const { t } = useTranslation()

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto pb-10">
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <LifeBuoy className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('nav.help', "Centre d'Aide Détaillé")}</h1>
            <p className="text-muted-foreground text-lg mt-1">Le guide complet pour maîtriser IT-Facture de A à Z.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="start" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Rocket className="w-4 h-4 mr-2" /> Démarrage
            </TabsTrigger>
            <TabsTrigger value="invoices" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <FileText className="w-4 h-4 mr-2" /> Facturation
            </TabsTrigger>
            <TabsTrigger value="payments" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <CreditCard className="w-4 h-4 mr-2" /> Paiements
            </TabsTrigger>
            <TabsTrigger value="advanced" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" /> Configuration
            </TabsTrigger>
            <TabsTrigger value="faq" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4 mr-2" /> FAQ
            </TabsTrigger>
          </TabsList>

          {/* DÉMARRAGE */}
          <TabsContent value="start" className="space-y-6 mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">1. Configurer son profil d'entreprise</CardTitle>
                <CardDescription>La première étape indispensable avant d'envoyer un document.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Avant de créer votre première facture, il est important que vos documents reflètent l'identité de votre entreprise. Rendez-vous dans <strong>Paramètres</strong> (en bas à gauche du menu latéral).</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Informations de base</strong> : Remplissez le nom de votre entreprise, votre adresse postale complète, numéro de téléphone et e-mail de contact.</li>
                  <li><strong>Identifiants Fiscaux</strong> : Ajoutez votre NINEA, RCCM, SIRET ou tout autre numéro d'identification fiscale. Il apparaîtra sur toutes vos factures.</li>
                  <li><strong>Logo et Cachet</strong> : Dans la section personnalisation, téléversez votre logo. Vous pouvez également uploader une image de votre cachet d'entreprise et de votre signature : ils seront automatiquement apposés au bas de vos factures PDF !</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">2. Importer sa base de clients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Ne perdez pas de temps à tout retaper à la main. IT-Facture vous permet d'importer toute votre base de données existante :</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Allez dans l'onglet <strong>Clients</strong>.</li>
                  <li>Cliquez sur le bouton <strong>Importer CSV</strong> en haut à droite.</li>
                  <li>Téléchargez le <em>Modèle CSV</em> fourni par l'application.</li>
                  <li>Ouvrez ce modèle dans Excel, copiez-collez vos clients dans les bonnes colonnes, puis enregistrez au format CSV.</li>
                  <li>Importez le fichier sur IT-Facture. Vos clients sont immédiatement disponibles !</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FACTURATION */}
          <TabsContent value="invoices" className="space-y-6 mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500" /> Du Devis à la Facture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Le cycle de vente classique commence souvent par un devis. Voici comment le gérer efficacement :</p>
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-1">Créer un Devis</h4>
                    <p className="text-sm">Allez dans <strong>Devis &gt; Nouveau Devis</strong>. Sélectionnez le client. Ajoutez vos lignes de produits/services. Le total se calcule tout seul (avec ou sans TVA selon vos paramètres). Cliquez sur <em>Enregistrer</em>.</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-1">Convertir en Facture</h4>
                    <p className="text-sm">Une fois que votre client a accepté le devis, ouvrez-le, et cliquez simplement sur le bouton <strong>Convertir en Facture</strong>. IT-Facture va générer une nouvelle facture identique, sans que vous n'ayez rien à retaper.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Repeat className="w-5 h-5 text-indigo-500" /> Factures Récurrentes (Abonnements)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  <p>Si vous facturez un service mensuel ou annuel (ex: hébergement web, loyer, maintenance) :</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Allez dans l'onglet <strong>Abonnements</strong>.</li>
                    <li>Créez un nouvel abonnement en définissant sa fréquence (Mensuelle, Trimestrielle, Annuelle).</li>
                    <li>Le système vous avertira ou génèrera la facture automatiquement lorsque la prochaine échéance sera atteinte.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Zap className="w-5 h-5 text-amber-500" /> Le module Tickets</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  <p>Les <strong>Tickets</strong> vous servent à suivre une tâche ponctuelle pour un client (ex: réparation d'un PC, mission de conseil de 2 jours).</p>
                  <p className="mt-2">Vous pouvez y noter vos heures travaillées ou les frais engagés. Une fois la mission terminée, un simple clic permet de transformer ce ticket en facture détaillée à envoyer au client.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* PAIEMENTS */}
          <TabsContent value="payments" className="space-y-6 mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Comment vos clients vous payent-ils ?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">1</span> 
                    Paiement hors-ligne (Espèces, Chèque, Virement)
                  </h3>
                  <p className="text-sm">Si le client vous paie physiquement ou par virement bancaire, vous devez enregistrer ce paiement manuellement :</p>
                  <ol className="list-decimal list-inside text-sm mt-2 ml-2 space-y-1">
                    <li>Ouvrez la facture concernée.</li>
                    <li>Cliquez sur le bouton <strong>Enregistrer un paiement</strong>.</li>
                    <li>Saisissez le montant reçu, la date et la méthode (ex: Virement bancaire).</li>
                    <li>La facture passera automatiquement au statut "Payée" ou "Partiellement Payée".</li>
                  </ol>
                </div>

                <div className="pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">2</span> 
                    Paiement en ligne automatisé (FedaPay)
                  </h3>
                  <p className="text-sm">IT-Facture vous permet d'encaisser l'argent par Mobile Money (MTN, Moov, Orange, Wave...) et par Carte Bancaire, directement depuis la facture PDF ou le lien web envoyé au client.</p>
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-4 mt-3">
                    <h4 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">Configuration de FedaPay :</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-indigo-900/80 dark:text-indigo-200/80">
                      <li>Créez un compte marchand sur <a href="https://fedapay.com" target="_blank" rel="noreferrer" className="underline font-medium">FedaPay</a>.</li>
                      <li>Récupérez vos "Clés API" (Clé publique et Clé secrète).</li>
                      <li>Dans IT-Facture, allez dans <strong>Paramètres &gt; FedaPay</strong> et collez ces clés.</li>
                      <li>Activez le module. Dès lors, vos factures comporteront un bouton "Payer en ligne". Les fonds atterriront sur votre compte FedaPay !</li>
                    </ul>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURATION */}
          <TabsContent value="advanced" className="space-y-6 mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Envoi de factures par e-mail (SMTP)</CardTitle>
                <CardDescription>Configurez IT-Facture pour envoyer des e-mails depuis votre propre adresse professionnelle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Par défaut, vous devez télécharger le PDF et l'envoyer vous-même. En configurant le SMTP, l'application peut envoyer directement l'e-mail avec le PDF en pièce jointe au client.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-red-500" /> Si vous utilisez Gmail</h4>
                    <p className="text-sm mb-3">Google bloque les mots de passe classiques pour les applications tierces. Vous devez créer un "Mot de passe d'application".</p>
                    <ol className="list-decimal list-inside text-sm space-y-1">
                      <li>Activez la Validation en 2 étapes sur votre compte Google.</li>
                      <li>Allez dans les paramètres de sécurité Google &gt; "Mots de passe des applications".</li>
                      <li>Générez un mot de passe pour "IT-Facture".</li>
                      <li>Dans les paramètres IT-Facture : Serveur = <code>smtp.gmail.com</code>, Port = <code>465</code>, Mot de passe = Le mot de passe généré (sans espaces).</li>
                    </ol>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500" /> Gestion des Rôles (Équipe)</h4>
                    <p className="text-sm mb-3">Vous n'êtes pas obligé de travailler seul. Vous pouvez inviter des collaborateurs !</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li><strong>Superadmin</strong> : Le créateur du Workspace. Accès total, peut supprimer l'entreprise.</li>
                      <li><strong>Admin</strong> : Accès à tout, sauf à la facturation globale de l'abonnement du logiciel.</li>
                      <li><strong>User</strong> : Peut créer des factures et voir les clients, mais n'a pas accès aux paramètres, ni aux rapports financiers globaux.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-0">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Foire Aux Questions</CardTitle>
                <CardDescription>Les questions les plus fréquentes posées par la communauté.</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger className="text-left font-medium">Est-ce que je perds mes données si mon PC s'éteint ?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Non ! IT-Facture est une application "Cloud" synchronisée en temps réel avec notre base de données sécurisée (Supabase). Toutes vos données sont stockées sur des serveurs hautement sécurisés. Vous pouvez vous connecter depuis n'importe quel ordinateur ou téléphone dans le monde, vous retrouverez vos factures à l'identique.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-2">
                    <AccordionTrigger className="text-left font-medium">Puis-je gérer plusieurs entreprises ?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Oui, le système fonctionne par "Espace de travail" (Workspace). Avec un seul compte utilisateur, vous pouvez créer plusieurs espaces de travail (si votre abonnement le permet). Chaque espace de travail est complètement isolé : clients, factures et paramètres sont séparés.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-3">
                    <AccordionTrigger className="text-left font-medium">Qu'est-ce que le module Dépenses ?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Pour bien piloter votre entreprise, il ne suffit pas de suivre l'argent qui rentre, il faut aussi suivre l'argent qui sort. L'onglet "Dépenses" vous permet d'enregistrer vos achats (matériel, abonnements logiciels, salaires). Le Tableau de bord calculera alors votre vrai "Bénéfice Net" en soustrayant vos dépenses de vos revenus.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-4">
                    <AccordionTrigger className="text-left font-medium">Comment changer le numéro de départ de ma facture ?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Si vous utilisez déjà un autre logiciel et que vous en êtes à la facture N°250, vous ne voulez pas recommencer à la N°1 ! Lors de la création de votre toute première facture sur IT-Facture, modifiez manuellement le champ "Numéro de facture" et mettez "FAC-0251". Le système est intelligent, la facture suivante sera automatiquement la "FAC-0252".
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="faq-5">
                    <AccordionTrigger className="text-left font-medium">Comment supprimer complètement mon compte ?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Si vous souhaitez arrêter d'utiliser l'application, rendez-vous dans <strong>Paramètres &gt; Sécurité et Accès</strong>. Un bouton rouge "Supprimer le compte" est disponible tout en bas. Attention : cette action est irréversible et supprimera instantanément toutes vos factures, devis, et clients de nos serveurs.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </motion.div>
    </motion.div>
  )
}
