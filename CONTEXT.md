# MadrasaApp - Contexte Projet

## 🎯 Objectif

MadrasaApp est un clone de Pronote adapté aux écoles coraniques des mosquées françaises. L'application permet de gérer les élèves, les présences, les notes et le planning pour les madrasas.

## 👥 Profils Utilisateurs

### 1. Admin (Directeur de mosquée)
- Créer un compte mosquée
- Gérer les classes
- Inscrire des élèves
- Gérer les professeurs
- Gérer le planning
- Envoyer des annonces

### 2. Professeur
- Faire l'appel (présences)
- Ajouter des notes
- Consulter son planning
- Voir ses classes et élèves

### 3. Parent
- Voir les présences de ses enfants
- Voir les notes de ses enfants
- Voir le planning

### 4. Élève
- Voir ses notes
- Voir ses présences
- Voir son planning

## 🛠️ Stack Technique

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS avec palette personnalisée
- **Animations**: Framer Motion
- **Base de données**: Neon (PostgreSQL)
- **ORM**: Prisma
- **Authentification**: NextAuth.js v4
- **Emails**: Resend (optionnel)
- **Déploiement**: Vercel

## 🎨 Design System

### Couleurs
- **Primaire (Vert islamique)**: `#2D6A4F`
- **Accent (Doré)**: `#D4AF37`
- **Fond**: Blanc
- **Texte**: `#1A1A1A`

### Principes UX
- Mobile-first, responsive
- Animations fluides avec Framer Motion
- Feedback visuel sur chaque action
- Design épuré et moderne
- Pas de layout cassé

## 📊 Modèles de Données

### Mosquee
- Informations de la mosquée (nom, adresse, logo, plan)

### User
- Compte utilisateur (email, password, role, mosqueeId)
- Rôles: ADMIN, PROFESSEUR, PARENT, ELEVE

### Classe
- Classe d'enseignement (nom, niveau, professeurId)

### Eleve
- Élève (nom, prenom, email, classeId, parentId, userId)

### Presence
- Présence d'un élève (date, statut: PRESENT/ABSENT/RETARD/EXCUSE)

### Note
- Note d'un élève (valeur, noteMax, matiere, commentaire)

### Planning
- Planning des cours (jour, heureDebut, heureFin, matiere, classeId)

### Annonce
- Annonce de la mosquée (titre, contenu, auteurId)

## 🔄 Synchronisation Temps Réel

Toutes les modifications utilisent `revalidatePath()` et `revalidateTag()` de Next.js pour garantir que les données sont synchronisées en temps réel entre tous les profils.

## 🔐 Authentification

- NextAuth.js avec Credentials Provider
- JWT pour les sessions
- Protection des routes par middleware basé sur les rôles

## 📱 Responsive Design

- Sidebar adaptative (mobile: menu hamburger, desktop: sidebar fixe)
- Navbar sticky avec informations utilisateur
- Toutes les pages sont mobile-first

## 🚀 Déploiement

### Variables d'environnement requises
- `DATABASE_URL`: URL de connexion Neon PostgreSQL
- `NEXTAUTH_SECRET`: Secret pour NextAuth
- `NEXTAUTH_URL`: URL de l'application
- `NEXT_PUBLIC_APP_URL`: URL publique de l'application
- `RESEND_API_KEY`: Clé API Resend (optionnel)

## 📝 Notes Importantes

- L'email des élèves est optionnel dans le schéma (pour compatibilité avec les données existantes) mais obligatoire dans le formulaire pour les nouveaux élèves
- Les présences sont uniques par élève/classe/date (contrainte unique)
- Toutes les mutations revalident automatiquement les pages concernées
