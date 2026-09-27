# CockroachDB — Guide MadrasaApp

MadrasaApp utilise **CockroachDB** via Prisma (`provider = "cockroachdb"`).

| Environnement | Usage | Commande |
|---------------|-------|----------|
| **Local** | Développement | Docker Compose (`npm run db:docker`) |
| **Cloud** | Production / staging | [CockroachDB Cloud](https://cockroachlabs.cloud/) |

---

## 1. Local (Docker) — déjà configuré

### Démarrer

```bash
npm run db:docker          # démarre CockroachDB + crée la base madrasa
npm run db:push            # applique le schéma Prisma
npm run db:seed            # données démo (demo123)
npm run dev                # http://localhost:3002
```

### URLs utiles

| Service | URL |
|---------|-----|
| SQL | `localhost:26257` |
| Admin UI | http://localhost:8080 |
| DATABASE_URL | `postgresql://root@localhost:26257/madrasa?sslmode=disable` |

### Commandes utiles

```bash
npm run db:docker:down     # arrêter les conteneurs
npm run db:docker:logs     # logs CockroachDB en direct
npm run db:test            # tester la connexion
npm run db:studio          # interface Prisma Studio
```

### Seed de charge (tests perf)

```bash
npm run db:seed-charge
# Admin : admin@test-charge.local / Test1234!
```

---

## 2. CockroachDB Cloud (production)

### Étape 1 — Créer un cluster

1. Aller sur [cockroachlabs.cloud](https://cockroachlabs.cloud/)
2. Créer un compte (gratuit : **Serverless** suffit pour démarrer)
3. **Create Cluster** → choisir **Serverless** (free tier)
4. Région : `eu-west-1` (Paris) ou `eu-central-1` (Francfort) pour la latence France
5. Nommer le cluster : `madrasa-prod`

### Étape 2 — Créer la base et l'utilisateur

Dans la **Cloud Console** → votre cluster → **SQL Shell** :

```sql
CREATE DATABASE IF NOT EXISTS madrasa;
CREATE USER IF NOT EXISTS madrasa_app WITH PASSWORD 'VOTRE_MOT_DE_PASSE_FORT';
GRANT ALL ON DATABASE madrasa TO madrasa_app;
```

### Étape 3 — Récupérer la connection string

Console → **Connect** → **General connection string** :

```
postgresql://madrasa_app:<password>@<host>.aws-eu-west-1.cockroachlabs.cloud:26257/madrasa?sslmode=verify-full
```

### Étape 4 — Configurer l'application

**Local (test contre Cloud)** — dans `.env` :

```env
DATABASE_URL="postgresql://madrasa_app:PASSWORD@HOST.crdb.io:26257/madrasa?sslmode=verify-full&connection_limit=5&pool_timeout=10"
```

**Vercel (production)** — Variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | Connection string Cloud (voir ci-dessus) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://votre-app.vercel.app` |

> **Serverless Vercel** : utilisez `connection_limit=1` ou `connection_limit=5` max pour éviter d'épuiser le pool CockroachDB.

### Étape 5 — Déployer le schéma

```bash
# Avec DATABASE_URL Cloud dans .env :
npm run db:migrate:deploy   # applique les migrations Prisma
npm run db:seed             # données démo (optionnel)
```

Ou en CI/Vercel (build command) :

```bash
npx prisma migrate deploy && npm run build
```

---

## 3. Migrations Prisma (recommandé pour prod)

Le projet inclut une migration initiale dans `prisma/migrations/`.

| Commande | Usage |
|----------|-------|
| `npm run db:migrate` | Créer une nouvelle migration (dev) |
| `npm run db:migrate:deploy` | Appliquer en prod (Cloud/Vercel) |
| `npm run db:push` | Sync rapide sans migration (dev local uniquement) |

**Baseline sur une DB locale déjà existante** (après `db push`) :

```bash
npx prisma migrate resolve --applied 20250917000000_init
```

---

## 4. Bonnes pratiques CockroachDB

### Pool de connexions

| Contexte | `connection_limit` |
|----------|-------------------|
| Dev local | 5 (défaut Prisma) |
| Vercel serverless | 1–5 |
| Serveur dédié | 10–20 |

Ajouter dans `DATABASE_URL` : `&connection_limit=5&pool_timeout=10`

### Retry transactions

CockroachDB utilise l'isolation **SERIALIZABLE**. Les conflits (`40001`) sont gérés automatiquement dans `lib/prisma.ts` via `withRetry()`.

### JWT NextAuth (pas de session DB)

La stratégie session est **JWT** — aucune requête Prisma à chaque appel API pour valider la session. Performant sur CockroachDB distribué.

---

## 5. Dépannage

| Problème | Solution |
|----------|----------|
| `EADDRINUSE :3002` | `lsof -ti :3002 \| xargs kill -9` |
| Port 26257 occupé | `docker ps` puis `docker stop madrasa-cockroachdb` |
| App vide après login | Se déconnecter/reconnecter (JWT obsolète après re-seed) |
| `connection refused` | `npm run db:docker` puis attendre `healthy` |
| SSL error en Cloud | Vérifier `sslmode=verify-full` dans DATABASE_URL |
| Lenteur 300ms en dev | Normal : compilation Next.js (cold). Warm = 5–20ms |

### Vérifier la connexion

```bash
npm run db:test
```

### Logs CockroachDB

```bash
npm run db:docker:logs
```

---

## 6. Checklist déploiement Cloud

- [ ] Cluster CockroachDB Cloud créé (Serverless EU)
- [ ] Base `madrasa` + user `madrasa_app` créés
- [ ] `DATABASE_URL` dans Vercel avec `sslmode=verify-full&connection_limit=5`
- [ ] `NEXTAUTH_SECRET` et `NEXTAUTH_URL` configurés
- [ ] `npm run db:migrate:deploy` exécuté sur Cloud
- [ ] `npm run db:seed` (optionnel, démo)
- [ ] Build Vercel OK (`prisma generate && next build`)
