# MadrasaApp

Application web de gestion pour les écoles coraniques des mosquées françaises — un « Pronote » adapté aux madrasas.

**Mosquée pilote :** AMP — Mosquée de Plaisir  
**Dépôt GitHub :** [github.com/Houcinefarhane/mosqueeApp](https://github.com/Houcinefarhane/mosqueeApp)  
**État actuel :** fonctionnel en local, prêt pour tests utilisateurs, pas encore déployé en production

---

## Sommaire

1. [Objectif du projet](#objectif-du-projet)
2. [Stack technique](#stack-technique)
3. [Profils et fonctionnalités](#profils-et-fonctionnalités)
4. [Modèle de données](#modèle-de-données)
5. [Avancement détaillé](#avancement-détaillé)
6. [Design et identité visuelle](#design-et-identité-visuelle)
7. [Installation et lancement](#installation-et-lancement)
8. [Comptes de démo](#comptes-de-démo)
9. [Accès depuis mobile (même Wi‑Fi)](#accès-depuis-mobile-même-wi‑fi)
10. [Structure du projet](#structure-du-projet)
11. [Prochaines étapes](#prochaines-étapes)
12. [Scripts npm](#scripts-npm)

---

## Objectif du projet

Centraliser la vie d'une école coranique dans une seule application :

- Gestion administrative (classes, élèves, parents, professeurs)
- Suivi pédagogique (appel, notes, devoirs, planning)
- Communication interne (annonces, messagerie)
- Consultation par les parents et les élèves de leurs données

Chaque mosquée est isolée : un admin crée sa mosquée, les autres utilisateurs s'inscrivent avec le **code mosquée**.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | Composants maison, Framer Motion, Recharts |
| Backend | Next.js API Routes |
| Base de données | CockroachDB (Cloud en prod, Docker local) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials + JWT) |
| Emails | Resend *(installé, pas encore branché)* |
| Hébergement prévu | Vercel |

---

## Profils et fonctionnalités

### 1. Admin (directeur de mosquée)

| Fonctionnalité | Statut | Route |
|----------------|--------|-------|
| Créer un compte mosquée | ✅ Fait | `/auth/inscription` |
| Tableau de bord (stats, graphiques, absences) | ✅ Fait | `/admin` |
| Gérer les classes (CRUD, assigner prof) | ✅ Fait | `/admin/classes` |
| Inscrire / gérer les élèves | ✅ Fait | `/admin/eleves` |
| Gérer les parents (liste, assigner enfants) | ✅ Fait | `/admin/parents` |
| Gérer les professeurs (CRUD, assigner classes) | ✅ Fait | `/admin/professeurs` |
| Planning des cours | ✅ Fait | `/admin/planning` |
| Annonces | ✅ Fait | `/admin/annonces` |
| Messagerie interne | ✅ Fait | `/admin/messages` |

### 2. Professeur

| Fonctionnalité | Statut | Route |
|----------------|--------|-------|
| Tableau de bord | ✅ Fait | `/professeur` |
| Mes classes et élèves | ✅ Fait | `/professeur/classes` |
| Faire l'appel (présences) | ✅ Fait | `/professeur/appel` |
| Historique des appels | ✅ Fait | `/professeur/appel/historique` |
| Saisir des notes (par session) | ✅ Fait | `/professeur/notes` |
| Historique des notes | ✅ Fait | `/professeur/notes/historique` |
| Devoirs / cahier de texte | ✅ Fait | `/professeur/devoirs` |
| Planning | ✅ Fait | `/professeur/planning` |
| Messagerie | ✅ Fait | `/professeur/messages` |

### 3. Parent

| Fonctionnalité | Statut | Route |
|----------------|--------|-------|
| Tableau de bord (enfants, absences, annonces) | ✅ Fait | `/parent` |
| Présences des enfants | ✅ Fait | `/parent/presences` |
| Notes | ✅ Fait | `/parent/notes` |
| Devoirs | ✅ Fait | `/parent/devoirs` |
| Planning | ✅ Fait | `/parent/planning` |
| Messagerie | ✅ Fait | `/parent/messages` |

### 4. Élève

| Fonctionnalité | Statut | Route |
|----------------|--------|-------|
| Tableau de bord | ✅ Fait | `/eleve` |
| Mes notes | ✅ Fait | `/eleve/notes` |
| Mes présences + calendrier | ✅ Fait | `/eleve/presences` |
| Devoirs | ✅ Fait | `/eleve/devoirs` |
| Planning | ✅ Fait | `/eleve/planning` |
| Messagerie | ✅ Fait | `/eleve/messages` |

### Authentification

| Fonctionnalité | Statut |
|----------------|--------|
| Connexion email / mot de passe | ✅ Fait |
| Inscription admin (création mosquée) | ✅ Fait |
| Inscription prof / parent / élève (code mosquée) | ✅ Fait |
| Mot de passe oublié | ❌ À faire |
| Validation admin des inscriptions | ❌ À faire |

---

## Modèle de données

Entités principales (Prisma / CockroachDB) :

- **Mosquee** — nom, adresse, contact, logo
- **User** — compte avec rôle (`ADMIN`, `PROFESSEUR`, `PARENT`, `ELEVE`)
- **Classe** — niveau, professeur assigné
- **Eleve** — fiche élève, lien parent, compte utilisateur optionnel
- **Appel** + **Presence** — appel du jour, statuts `PRESENT`, `ABSENT`, `RETARD`, `EXCUSE`
- **NoteSession** + **Note** — notes par matière et session
- **Planning** — créneaux hebdomadaires par classe
- **Devoir** — devoirs et cahier de texte
- **Annonce** — communications de la mosquée
- **Message** — messagerie interne entre utilisateurs

---

## Avancement détaillé

### ✅ Ce qui est terminé

- **Cœur métier** : appel, notes, devoirs, planning, annonces, messagerie
- **4 espaces utilisateurs** complets avec navigation par rôle
- **API REST** (~30 routes) + protection middleware par rôle
- **Données de démo** via `npm run db:seed`
- **Build production** qui passe (`npm run build`)
- **Git** configuré et synchronisé sur GitHub (`main`)
- **Identité visuelle AMP** : palette marron/doré, logo mosquée
- **Responsive mobile** : viewport iPhone, barre de navigation basse, menu latéral, safe-area

### 🔄 En cours / partiel

- **README** et documentation (ce fichier)
- **Tests manuels** sur iPhone via IP locale

### ❌ Pas encore fait

| Priorité | Fonctionnalité |
|----------|----------------|
| Haute | Notifications email (Resend) |
| Haute | Mot de passe oublié |
| Haute | Migrations Prisma versionnées (au lieu de `db:push` seul) |
| Haute | Déploiement Vercel |
| Moyenne | CRUD admin plus complet (créer parent, modifier/supprimer comptes) |
| Moyenne | Page annonces dédiée pour parents/élèves |
| Moyenne | Justification d'absence par le parent |
| Moyenne | Profil utilisateur (changer mot de passe, infos perso) |
| Moyenne | Validation des inscriptions par l'admin |
| Basse | Exports PDF/CSV (présences, bulletins) |
| Basse | Paiements / cotisations (existait sur une ancienne version GitHub) |
| Basse | Tests automatisés |

### Historique Git notable

- `178069e` — Initial commit (application complète)
- `1a9f5ff` — Nettoyage doc (README seul)
- `547f9e7` — Identité AMP + améliorations mobile

---

## Design et identité visuelle

Palette extraite du logo **AMP — Mosquée de Plaisir** :

| Rôle | Couleur | Hex |
|------|---------|-----|
| Marron principal | Texte, navbar, sidebar | `#5D3A2F` |
| Marron foncé | Accents | `#3D251E` |
| Doré / ocre | Accents, bordures | `#B28C5F` |
| Fond crème | Arrière-plan | `#FAF6F0` |

- **Police** : Inter (Google Fonts)
- **Logo** : `public/logo-mosquee.png`
- **Approche** : mobile-first, barre de navigation en bas sur iPhone

---

## Installation et lancement

### Prérequis

- Node.js 18+
- CockroachDB (Docker local ou CockroachDB Cloud)

### Étapes

```bash
git clone https://github.com/Houcinefarhane/mosqueeApp.git
cd mosqueeApp-main
npm install
```

Copier `.env.example` vers `.env` et ajuster si besoin :

```env
DATABASE_URL="postgresql://root@localhost:26257/madrasa?sslmode=disable"
NEXTAUTH_SECRET="..."          # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3002"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
# RESEND_API_KEY="..."         # optionnel, pas encore utilisé
```

Démarrer CockroachDB en local :

```bash
npm run db:docker   # single-node sur le port 26257 (UI admin : http://localhost:8080)
```

Initialiser la base :

```bash
npm run db:setup    # db:push + seed démo
# ou séparément :
npm run db:push
npm run db:seed
```

Lancer le serveur :

```bash
npm run dev
```

→ [http://localhost:3002](http://localhost:3002)

> **Attention :** ne pas lancer `npm run build` pendant que `npm run dev` tourne (corrompt le cache `.next`). En cas de styles cassés : `rm -rf .next && npm run dev`.

---

## Comptes de démo

Mot de passe pour tous : **`demo123`**

| Rôle | Email |
|------|-------|
| Admin | `admin@demo.fr` |
| Professeur | `prof@demo.fr` |
| Parent | `parent@demo.fr` |
| Élève | `eleve@demo.fr` |

Recréer les données démo :

```bash
npm run db:seed -- --force
```

---

## Accès depuis mobile (même Wi‑Fi)

1. Lancer `npm run dev` sur le Mac
2. Trouver l'IP locale du Mac (`ipconfig getifaddr en0`)
3. Sur l'iPhone (Safari) : `http://<IP-DU-MAC>:3002`
4. Pour le login sur téléphone, mettre temporairement dans `.env` :
   ```env
   NEXTAUTH_URL=http://<IP-DU-MAC>:3002
   NEXT_PUBLIC_APP_URL=http://<IP-DU-MAC>:3002
   ```
5. Redémarrer le serveur, recharger la page

---

## Structure du projet

```
mosqueeApp-main/
├── app/
│   ├── admin/           # Espace administrateur
│   ├── professeur/      # Espace professeur
│   ├── parent/          # Espace parent
│   ├── eleve/           # Espace élève
│   ├── auth/            # Login + inscriptions
│   └── api/             # Routes API REST
├── components/
│   ├── ui/              # Boutons, cartes, inputs…
│   ├── layout/          # Navbar, sidebar, shell dashboard
│   ├── dashboard/       # Graphiques, bannière mosquée
│   ├── messages/        # Client messagerie
│   └── devoirs/         # Cartes devoirs
├── lib/
│   ├── auth.ts          # NextAuth
│   ├── prisma.ts        # Client Prisma
│   ├── navigation/      # Config navigation mobile
│   └── validators/        # Schémas Zod
├── prisma/
│   └── schema.prisma    # Schéma base de données
├── scripts/
│   ├── seed.ts          # Données de démo
│   └── test-db.ts       # Test connexion DB
├── public/
│   └── logo-mosquee.png
└── middleware.ts          # Protection routes par rôle
```

---

## Prochaines étapes

Ordre recommandé pour la suite du développement :

1. **Notifications email** (Resend) — annonces, absences, devoirs
2. **Mot de passe oublié**
3. **Migrations Prisma** + déploiement **Vercel**
4. **CRUD admin** (création parent, édition comptes)
5. **Justification absences** + page annonces parents
6. **Exports PDF** (présences, relevés de notes)

---

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur dev (port **3002**) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:push` | Pousser le schéma vers la DB |
| `npm run db:migrate` | Créer une migration |
| `npm run db:studio` | Interface Prisma Studio |
| `npm run db:seed` | Insérer les données démo |
| `npm run db:setup` | `db:push` + `db:seed` |
| `npm run db:docker` | CockroachDB via Docker Compose |
| `npm run db:seed-charge` | Seed massif pour tests de performance |

---

## Licence

Projet privé — usage interne Mosquée de Plaisir / AMP.
