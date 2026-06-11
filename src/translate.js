const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'app/(dashboard)/quotes/page.tsx',
    rules: [
      { from: "'Brouillon'", to: "t('common.draft', 'Brouillon')" },
    ]
  },
  {
    file: 'app/(dashboard)/expenses/page.tsx',
    rules: [
      { from: 'alert("L\'exportation CSV des dépenses sera disponible dans une prochaine mise à jour Web.")', to: "alert(t('expenses.exportMsg', 'L\\'exportation CSV des dépenses sera disponible dans une prochaine mise à jour Web.'))" },
      { from: '>Fonctionnalité Verrouillée<', to: ">{t('upgrade.locked', 'Fonctionnalité Verrouillée')}<" },
      { from: 'La gestion des dépenses est disponible à partir du plan Pro. Suivez vos sorties d\'argent, classez-les par catégories et préparez votre comptabilité facilement.', to: "{t('expenses.lockedMsg', 'La gestion des dépenses est disponible à partir du plan Pro. Suivez vos sorties d\\'argent, classez-les par catégories et préparez votre comptabilité facilement.')}" },
      { from: '>Passer à la version Pro<', to: ">{t('upgrade.upgradeBtn', 'Passer à la version Pro')}<" },
      { from: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>', to: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("common.date", "Date")}</th>' },
      { from: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">Titre</th>', to: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("common.title", "Titre")}</th>' },
      { from: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">Catégorie</th>', to: '<th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("common.category", "Catégorie")}</th>' },
      { from: '<th className="text-right py-3 px-4 font-medium text-muted-foreground">Montant</th>', to: '<th className="text-right py-3 px-4 font-medium text-muted-foreground">{t("common.amount", "Montant")}</th>' },
      { from: '<th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>', to: '<th className="text-center py-3 px-4 font-medium text-muted-foreground">{t("common.actions", "Actions")}</th>' },
      { from: '<Label>Titre *</Label>', to: '<Label>{t("common.title", "Titre")} *</Label>' },
      { from: '<Label>Montant *</Label>', to: '<Label>{t("common.amount", "Montant")} *</Label>' },
      { from: '<Label>Catégorie</Label>', to: '<Label>{t("common.category", "Catégorie")}</Label>' },
      { from: '<Label>Date</Label>', to: '<Label>{t("common.date", "Date")}</Label>' },
      { from: 'placeholder="Ex: Matériel, Licences..."', to: 'placeholder={t("expenses.categoryPlaceholder", "Ex: Matériel, Licences...")}' },
    ]
  },
  {
    file: 'app/(dashboard)/invoices/page.tsx',
    rules: [
      { from: "const headers = ['Numéro', 'Client', 'Date', 'Total HT', 'Total TVA', 'Total TTC', 'Statut']", to: "const headers = [t('invoices.invoiceNumber', 'Numéro'), t('invoices.client', 'Client'), t('common.date', 'Date'), t('invoices.subtotal', 'Total HT'), t('invoices.vat', 'Total TVA'), t('invoices.total', 'Total TTC'), t('invoices.status', 'Statut')]" },
      { from: 'download\', `factures_export_', to: "download', `invoices_export_" },
      { from: '>Passez à Essential<', to: ">{t('upgrade.essential', 'Passez à Essential')}<" },
      { from: '>Cette action supprimera définitivement cette facture.<', to: ">{t('invoices.deleteWarning', 'Cette action supprimera définitivement cette facture.')}<" },
    ]
  },
  {
    file: 'app/(dashboard)/clients/page.tsx',
    rules: [
      { from: '>Passez à Essential<', to: ">{t('upgrade.essential', 'Passez à Essential')}<" },
      { from: 'alert("L\'importation de fichiers CSV sera disponible prochainement dans la version Web.")', to: 'alert(t("clients.importMsg", "L\'importation de fichiers CSV sera disponible prochainement dans la version Web."))' },
    ]
  },
  {
    file: 'app/(dashboard)/services/page.tsx',
    rules: [
      { from: '>Passez à Essential<', to: ">{t('upgrade.essential', 'Passez à Essential')}<" },
      { from: '>Cette action supprimera définitivement ce service.<', to: ">{t('services.deleteWarning', 'Cette action supprimera définitivement ce service.')}<" },
    ]
  },
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
