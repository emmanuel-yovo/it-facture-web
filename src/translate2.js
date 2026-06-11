const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'app/(dashboard)/reminders/page.tsx',
    rules: [
      { from: '<h1>Relances & Rappels</h1>', to: '<h1 className="text-3xl font-bold">{t("reminders.title", "Relances & Rappels")}</h1>' },
      { from: '>Relances & Rappels<', to: '>{t("reminders.title", "Relances & Rappels")}<' },
      { from: '>Gérez vos rappels de paiement et rendez-vous.<', to: '>{t("reminders.subtitle", "Gérez vos rappels de paiement et rendez-vous.")}<' },
      { from: '>Vous n\'avez aucun rappel planifié pour le moment.<', to: '>{t("reminders.noDataDesc", "Vous n\'avez aucun rappel planifié pour le moment.")}<' },
      { from: ' Prévue<', to: ' {t("common.planned", "Prévue")}<' },
      { from: '>Type<', to: '>{t("common.type", "Type")}<' },
      { from: '>Message<', to: '>{t("common.message", "Message")}<' },
      { from: '>Paiement<', to: '>{t("reminders.payment", "Paiement")}<' },
      { from: '>Rendez-vous<', to: '>{t("reminders.appointment", "Rendez-vous")}<' },
      { from: '>Autre<', to: '>{t("common.other", "Autre")}<' },
      { from: "r.status === 'sent' ? 'Envoyé' : r.status === 'failed' ? 'Échoué' : 'En attente'", to: "r.status === 'sent' ? t('reminders.sent', 'Envoyé') : r.status === 'failed' ? t('reminders.failed', 'Échoué') : t('reminders.pending', 'En attente')" },
      { from: 'title="Marquer comme envoyé"', to: 'title={t("reminders.markSent", "Marquer comme envoyé")}' },
      { from: '>Programmer un rappel<', to: '>{t("reminders.schedule", "Programmer un rappel")}<' },
      { from: '>Facture concernée *<', to: '>{t("reminders.invoiceRef", "Facture concernée *")}<' },
      { from: '>Relance Paiement<', to: '>{t("reminders.paymentReminder", "Relance Paiement")}<' },
      { from: '>Message personnalisé<', to: '>{t("reminders.customMsg", "Message personnalisé")}<' }
    ]
  },
  {
    file: 'app/(dashboard)/reports/page.tsx',
    rules: [
      { from: '>Analyses Financières<', to: '>{t("reports.title", "Analyses Financières")}<' },
      { from: '>Suivez la performance et la rentabilité de votre entreprise.<', to: '>{t("reports.subtitle", "Suivez la performance et la rentabilité de votre entreprise.")}<' },
      { from: '>Base de données<', to: '>{t("reports.db", "Base de données")}<' },
      { from: '> Performance Mensuelle<', to: '> {t("reports.monthlyPerf", "Performance Mensuelle")}<' },
      { from: '>Visualisation des flux de revenus et dépenses par mois.<', to: '>{t("reports.monthlyPerfDesc", "Visualisation des flux de revenus et dépenses par mois.")}<' },
      { from: 'name="Revenus"', to: 'name={t("reports.revenues", "Revenus")}' },
      { from: 'name="Dépenses"', to: 'name={t("nav.expenses", "Dépenses")}' },
      { from: '> Top 5 Clients<', to: '> {t("reports.topClients", "Top 5 Clients")}<' },
      { from: '>Basé sur le chiffre d\'affaires total généré.<', to: '>{t("reports.topClientsDesc", "Basé sur le chiffre d\'affaires total généré.")}<' },
      { from: '> Particulier<', to: '> {t("common.individual", "Particulier")}<' },
      { from: "> Répartition des Dépenses<", to: '> {t("reports.expenseBreakdown", "Répartition des Dépenses")}<' },
      { from: '>Analyse par catégorie de coûts.<', to: '>{t("reports.expenseBreakdownDesc", "Analyse par catégorie de coûts.")}<' }
    ]
  },
  {
    file: 'app/(dashboard)/tickets/page.tsx',
    rules: [
      { from: '>Interventions / Tickets<', to: '>{t("tickets.title", "Interventions / Tickets")}<' },
      { from: '>Gérez vos interventions techniques et leur facturation.<', to: '>{t("tickets.subtitle", "Gérez vos interventions techniques et leur facturation.")}<' },
      { from: '>Tous<', to: '>{t("common.all", "Tous")}<' },
      { from: '>Ouverts<', to: '>{t("tickets.open", "Ouverts")}<' },
      { from: '>En cours<', to: '>{t("tickets.inProgress", "En cours")}<' },
      { from: '>Commencez par créer votre première intervention de maintenance.<', to: '>{t("tickets.noDataDesc", "Commencez par créer votre première intervention de maintenance.")}<' },
      { from: '>Ouvert<', to: '>{t("tickets.openBadge", "Ouvert")}<' },
      { from: '>Fermé<', to: '>{t("tickets.closedBadge", "Fermé")}<' },
      { from: '>Facturé<', to: '>{t("tickets.billedBadge", "Facturé")}<' },
      { from: '>Haute<', to: '>{t("tickets.high", "Haute")}<' },
      { from: '>Moyenne<', to: '>{t("tickets.medium", "Moyenne")}<' },
      { from: '>Basse<', to: '>{t("tickets.low", "Basse")}<' },
      { from: '> Convertir en facture<', to: '> {t("tickets.convertToInvoice", "Convertir en facture")}<' },
      { from: '>Fonctionnalité Verrouillée<', to: ">{t('upgrade.locked', 'Fonctionnalité Verrouillée')}<" },
      { from: 'La gestion des tickets et interventions techniques est réservée au plan Pro et Agence. Gérez vos maintenances et facturez vos interventions facilement.', to: "{t('tickets.lockedMsg', 'La gestion des tickets et interventions techniques est réservée au plan Pro et Agence. Gérez vos maintenances et facturez vos interventions facilement.')}" },
      { from: '>Passer à la version Pro<', to: ">{t('upgrade.upgradeBtn', 'Passer à la version Pro')}<" }
    ]
  },
  {
    file: 'app/(dashboard)/discounts/page.tsx',
    rules: [
      { from: '>Ajouter une remise<', to: '>{t("discounts.addDiscount", "Ajouter une remise")}<' },
      { from: '>Type<', to: '>{t("common.type", "Type")}<' },
      { from: '>Valeur<', to: '>{t("discounts.value", "Valeur")}<' },
      { from: '>Code promo<', to: '>{t("discounts.promoCode", "Code promo")}<' },
      { from: '>Date d\'expiration<', to: '>{t("discounts.expiresAt", "Date d\'expiration")}<' },
    ]
  },
  {
    file: 'app/(dashboard)/payments/page.tsx',
    rules: [
      { from: '>Historique des Paiements<', to: '>{t("payments.title", "Historique des Paiements")}<' },
      { from: '>Client<', to: '>{t("invoices.client", "Client")}<' },
      { from: '>Méthode<', to: '>{t("payments.method", "Méthode")}<' },
      { from: '>Référence<', to: '>{t("payments.reference", "Référence")}<' },
    ]
  }
];

for (const rep of replacements) {
  const filePath = path.join(__dirname, rep.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const rule of rep.rules) {
      content = content.replace(rule.from, rule.to);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${rep.file}`);
  } else {
    console.log(`Not found: ${rep.file}`);
  }
}
