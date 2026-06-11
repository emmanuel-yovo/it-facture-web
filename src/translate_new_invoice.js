const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/(dashboard)/invoices/new/page.tsx');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf-8');

  const rules = [
    { from: '>Sélectionner le client<', to: '>{t("invoices.selectClient", "Sélectionner le client")}<' },
    { from: 'placeholder="Rechercher un client..."', to: 'placeholder={t("clients.search", "Rechercher un client...")}' },
    { from: '>Client exonéré / Hors taxe<', to: '>{t("invoices.clientExempt", "Client exonéré / Hors taxe")}<' },
    { from: '>Ce client est enregistré dans un pays différent', to: '>{t("invoices.exemptDesc1", "Ce client est enregistré dans un pays différent")}' },
    { from: '>Le taux de taxe (', to: '>{t("invoices.exemptDesc2", "Le taux de taxe (")}' },
    { from: '>Sélectionner les services<', to: '>{t("invoices.selectServices", "Sélectionner les services")}<' },
    { from: 'placeholder="Rechercher un service..."', to: 'placeholder={t("services.search", "Rechercher un service...")}' },
    { from: 'alert("Code promo invalide ou expiré.")', to: 'alert(t("invoices.invalidPromo", "Code promo invalide ou expiré."))' },
    { from: 'alert("Erreur lors de la validation du code promo.")', to: 'alert(t("invoices.errorPromo", "Erreur lors de la validation du code promo."))' },
    { from: 'alert("Erreur lors de la création")', to: 'alert(t("invoices.createError", "Erreur lors de la création"))' },
  ];

  for (const rule of rules) {
    content = content.replace(rule.from, rule.to);
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Updated new invoice page');
}
