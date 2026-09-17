# MadrasaApp

Application de gestion complète pour les écoles coraniques des mosquées françaises. Clone de Pronote adapté aux besoins spécifiques des madrasas.

## 🚀 Fonctionnalités

### 3 Profils utilisateurs

#### 1. Admin (Directeur mosquée)
- ✅ Créer un compte mosquée (UC-A01)
- ✅ Gérer les classes (UC-A02)
- ✅ Inscrire des élèves (UC-A03)
- ✅ Gérer les professeurs (UC-A04)
- Tableau de bord avec statistiques
- Envoi d'annonces

#### 2. Professeur
- ✅ Faire l'appel (UC-P01)
- ✅ Ajouter des notes (UC-P02)
- Consulter son planning
- Voir sa liste d'élèves
- Messagerie avec les parents

#### 3. Parent
- ✅ Voir les présences (UC-PR01)
- ✅ Voir le planning (UC-PR03)
- Consulter les notes
- Recevoir les notifications

## 🛠️ Stack technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Next.js API Routes
- **Base de données**: Neon (PostgreSQL)
- **ORM**: Prisma
- **Authentification**: NextAuth.js
- **Notifications**: Resend (email)
- **Déploiement**: Vercel

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd mosquée
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créer un fichier `.env` à la racine du projet avec :
- `DATABASE_URL` : URL de connexion Neon PostgreSQL
- `NEXTAUTH_SECRET` : Secret pour NextAuth (générer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` : URL de l'application (ex: `http://localhost:3002`)
- `NEXT_PUBLIC_APP_URL` : URL publique de l'application (ex: `http://localhost:3002`)
- `RESEND_API_KEY` : Clé API Resend (optionnel)

4. **Configurer la base de données**
```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Ou créer une migration
npm run db:migrate
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3002](http://localhost:3002)

## 🎨 Design System

- **Couleur principale**: Vert islamique (#2D6A4F)
- **Couleur accent**: Doré (#D4AF37)
- **Approche**: Mobile-first, responsive
- **Animations**: Framer Motion pour des transitions fluides

## 📁 Structure du projet

```
mosquée/
├── app/                    # Pages Next.js (App Router)
│   ├── admin/             # Pages Admin
│   ├── professeur/        # Pages Professeur
│   ├── parent/            # Pages Parent
│   ├── auth/              # Authentification
│   └── api/               # API Routes
├── components/            # Composants React
│   ├── ui/               # Composants UI réutilisables
│   └── layout/           # Layout components
├── lib/                   # Utilitaires
│   ├── prisma.ts         # Client Prisma
│   ├── auth.ts           # Configuration NextAuth
│   └── utils.ts          # Fonctions utilitaires
├── prisma/               # Prisma
│   └── schema.prisma     # Schéma de base de données
└── types/                # Types TypeScript
```

## 🔐 Authentification

L'application utilise NextAuth.js avec authentification par credentials. Les rôles sont :
- `ADMIN` : Directeur de mosquée
- `PROFESSEUR` : Professeur
- `PARENT` : Parent d'élève

## 📧 Notifications

Les notifications email sont gérées via Resend (configuration optionnelle).

## 🚀 Déploiement

### Vercel

1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement dans Vercel
3. Déployer automatiquement

### Variables d'environnement requises

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

## 📝 Scripts disponibles

- `npm run dev` : Lancer le serveur de développement
- `npm run build` : Build de production
- `npm run start` : Lancer le serveur de production
- `npm run lint` : Lancer ESLint
- `npm run db:generate` : Générer le client Prisma
- `npm run db:push` : Pousser le schéma vers la DB
- `npm run db:migrate` : Créer une migration
- `npm run db:studio` : Ouvrir Prisma Studio

## 📄 Licence

Ce projet est privé et réservé à un usage interne.
