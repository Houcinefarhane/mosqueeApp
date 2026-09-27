# Déploiement Vercel — MadrasaApp

## Prérequis

1. **Neon PostgreSQL** configuré ([console.neon.tech](https://console.neon.tech/))
2. Compte [Vercel](https://vercel.com) connecté à GitHub
3. Repo poussé sur GitHub : `Houcinefarhane/mosqueeApp`

---

## Étape 1 — Neon

Voir [docs/neon.md](./neon.md).

Connection string (**Pooled**, recommandé pour Vercel) :
```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/madrasa?sslmode=require
```

Appliquer le schéma une première fois (depuis votre Mac, avec DATABASE_URL Neon dans `.env`) :
```bash
npm run db:push
npm run db:seed    # optionnel — comptes démo
```

---

## Étape 2 — Variables d'environnement Vercel

Dans **Vercel Dashboard** → Project → **Settings** → **Environment Variables** :

| Variable | Valeur | Environnements |
|----------|--------|----------------|
| `DATABASE_URL` | Connection string Neon (Pooled) | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://votre-projet.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | Même URL que NEXTAUTH_URL | Production, Preview |

---

## Étape 3 — Déployer

### Via GitHub (recommandé)

1. [vercel.com/new](https://vercel.com/new) → Import `Houcinefarhane/mosqueeApp`
2. Ajouter les variables d'environnement
3. **Deploy**

### Via CLI

```bash
vercel login
vercel --prod
```

---

## Build Vercel

```
prisma generate
prisma db push
next build
```

Région : **Paris (cdg1)** — `vercel.json`.

---

## Checklist

- [ ] Projet Neon créé (région EU)
- [ ] `DATABASE_URL` Neon (Pooled) dans Vercel
- [ ] `NEXTAUTH_SECRET` et URLs configurés
- [ ] `npm run db:push` + seed exécutés sur Neon
- [ ] Build Vercel vert ✅
