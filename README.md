# IT-Facture Web 🚀

**IT-Facture** est une solution complète, moderne et performante de gestion de facturation et de devis, spécialement conçue pour les freelances, les TPE et les PME. 

Initialement développée comme une application bureau locale, cette version représente la refonte majeure vers une architecture Web SaaS basée sur **Next.js 15 (App Router)** et **Supabase**.

## 🌟 Fonctionnalités Principales

- **Gestion des Clients & Services :** Annuaire centralisé de vos clients et catalogue de vos services.
- **Facturation & Devis :** Création intuitive, gestion des taxes (TVA, exonérations) et des remises.
- **Paiements en ligne :** Intégration native de l'API **FedaPay** pour recevoir vos paiements directement par Mobile Money et Carte Bancaire.
- **Rapports Financiers :** Tableaux de bord interactifs (Recharts) pour suivre votre chiffre d'affaires, vos bénéfices et vos dépenses.
- **Génération PDF :** Export côté client de vos factures au format PDF professionnel avec vos logos et cachets.
- **Espace Collaboratif (Multi-workspace) :** Prêt pour un modèle SaaS permettant à différentes entreprises de gérer leur propre espace de travail de façon isolée (Row Level Security).

## 🛠️ Stack Technique

- **Framework :** [Next.js 15](https://nextjs.org/) (React, App Router, Turbopack)
- **Base de données & Authentification :** [Supabase](https://supabase.com/) (PostgreSQL, RLS, Storage)
- **Design & UI :** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icônes :** Lucide React
- **Graphiques :** Recharts
- **Paiements :** FedaPay

## 🚀 Installation & Déploiement

### Déploiement sur Vercel (Recommandé)
Ce projet est optimisé pour être déployé en un clic sur Vercel. Vous devez configurer les variables d'environnement suivantes dans votre projet Vercel :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase
NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY=votre_cle_publique_fedapay
FEDAPAY_SECRET_KEY=votre_cle_secrete_fedapay
FEDAPAY_ENVIRONMENT=live # ou sandbox
```

### Lancement Local
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/emmanuel-yovo/it-facture-web.git
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Copiez le fichier `.env.local` et remplissez-le.
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🔒 Sécurité
Toutes les données sont sécurisées au niveau de la base de données via les politiques **RLS (Row Level Security)** de Supabase. Chaque entreprise n'a accès qu'à ses propres clients, factures et statistiques.

---
*Conçu pour simplifier la facturation et accélérer les paiements.*
