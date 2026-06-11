const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'app/(dashboard)/expenses/page.tsx',
    rules: [
      { from: '>Suivez vos sorties d\'argent<', to: '>{t("expenses.subtitle", "Suivez vos sorties d\'argent")}<' }
    ]
  },
  {
    file: 'app/(dashboard)/tickets/page.tsx',
    rules: [
      { from: '>En cours</Button>', to: '>{t("tickets.inProgress", "En cours")}</Button>' }
    ]
  },
  {
    file: 'app/(dashboard)/reports/page.tsx',
    rules: [
      { from: '>Accès restreint aux administrateurs.<', to: '>{t("common.accessDeniedAdmin", "Accès restreint aux administrateurs.")}<' }
    ]
  },
  {
    file: 'app/(dashboard)/audit/page.tsx',
    rules: [
      { from: 'import { Activity, Search, ShieldAlert, ChevronLeft, ChevronRight } from \'lucide-react\'', to: 'import { Activity, Search, ShieldAlert, ChevronLeft, ChevronRight } from \'lucide-react\'\nimport { useTranslation } from \'react-i18next\'' },
      { from: 'export default function AuditPage() {', to: 'export default function AuditPage() {\n  const { t } = useTranslation()' },
      { from: '>Accès Refusé<', to: '>{t("common.accessDenied", "Accès Refusé")}<' },
      { from: '>Vous n\'avez pas les droits pour voir le journal d\'activité.<', to: '>{t("audit.accessDeniedDesc", "Vous n\'avez pas les droits pour voir le journal d\'activité.")}<' },
      { from: '>Journal d\'Activité<', to: '>{t("audit.title", "Journal d\'Activité")}<' },
      { from: '"Historique global des actions (Vue SuperAdmin)"', to: 't("audit.subtitleGlobal", "Historique global des actions (Vue SuperAdmin)")' },
      { from: '"Historique des actions effectuées sur votre espace de travail."', to: 't("audit.subtitleWorkspace", "Historique des actions effectuées sur votre espace de travail.")' },
      { from: '>Date & Heure<', to: '>{t("audit.dateTime", "Date & Heure")}<' },
      { from: '>Utilisateur<', to: '>{t("audit.user", "Utilisateur")}<' },
      { from: '>Action<', to: '>{t("audit.action", "Action")}<' },
      { from: '>Ressource<', to: '>{t("audit.resource", "Ressource")}<' },
      { from: '>Détails<', to: '>{t("audit.details", "Détails")}<' },
      { from: '|| \'Système\'', to: '|| t("audit.system", "Système")' },
      { from: 'Aucune activité enregistrée.', to: '{t("audit.noData", "Aucune activité enregistrée.")}' },
      { from: 'Page {page} sur {totalPages}', to: '{t("common.page", "Page")} {page} {t("common.of", "sur")} {totalPages}' }
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
