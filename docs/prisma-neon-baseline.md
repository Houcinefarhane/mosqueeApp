# Neon + Prisma : baseline des migrations

## Contexte

Si la base a été créée avec `prisma db push`, la table `_prisma_migrations` est vide ou absente. Un `prisma migrate deploy` (Vercel) peut alors échouer avec **P3005** (« database schema is not empty ») en tentant d’appliquer `20250917000000_init` sur un schéma déjà existant.

## Procédure (une fois par base existante)

Avec `DATABASE_URL` pointant vers la base concernée (Neon prod ou staging) :

```bash
# 1. Aligner le schéma sur schema.prisma (colonnes RGPD, PrivacyConsentLog, etc.)
npx prisma db push

# 2. Marquer les migrations du dépôt comme déjà appliquées (sans les ré-exécuter)
npx prisma migrate resolve --applied 20250917000000_init
npx prisma migrate resolve --applied 20260408140000_privacy_consent

# 3. Vérifier
npx prisma migrate status
npx prisma migrate deploy   # doit afficher "No pending migrations"
```

## Vercel

- `vercel.json` utilise `prisma migrate deploy` dans le `buildCommand` (après baseline).
- Ne pas mélanger `db push` et `migrate deploy` sur la même base sans avoir baseliné.

## Nouvelle base vide

Sur une base PostgreSQL **vide**, seul `npx prisma migrate deploy` suffit (pas de `resolve`).
