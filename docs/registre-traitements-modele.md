# Modèle — Registre des traitements (mosquée)

Document à compléter par **chaque mosquée** (responsable de traitement). Conserver une version signée / datée.

## Traitement 1 — Gestion école coranique (MadrasApp)

| Champ | Contenu |
|--------|---------|
| Finalité | Scolarité : classes, notes, présences, devoirs, planning, annonces |
| Base légale | Mission éducative / exécution du contrat avec les familles |
| Catégories de personnes | Élèves, parents, enseignants, administrateurs |
| Données | Identité, contact, données scolaires, messagerie interne |
| Destinataires | Personnel autorisé de la mosquée |
| Sous-traitants | Hébergeur applicatif (Vercel), base de données (Neon), éditeur MadrasApp |
| Transferts hors UE | Selon DPA sous-traitants (SCC) |
| Durée | Durée de scolarité + délais légaux/archivage interne |
| Mesures de sécurité | Comptes par rôle, mots de passe, HTTPS |

## Traitement 2 — Comptes utilisateurs

| Champ | Contenu |
|--------|---------|
| Finalité | Authentification et droits d'accès |
| Données | E-mail, mot de passe hashé, rôle, journal consentements |
| Durée | Jusqu'à suppression du compte ou fin d'activité mosquée |

## Traitement 3 — Mesure d'audience (optionnelle)

| Champ | Contenu |
|--------|---------|
| Finalité | Statistiques d'usage agrégées |
| Base légale | Consentement (bandeau cookies) |
| Sous-traitant | Vercel Analytics |
| Durée | Selon politique Vercel ; consentement révocable |

## Droits des personnes

- Export / suppression compte : application (`/compte/donnees-personnelles`).
- Dossier scolaire : accueil mosquée.
- Réclamation : CNIL.

## Incidents

Procédure interne : identifier, contenir, notifier la CNIL sous 72 h si risque pour les droits, informer les personnes si nécessaire.
