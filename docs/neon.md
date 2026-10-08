# Neon PostgreSQL — Guide MadrasApp

MadrasApp utilise **Neon** (PostgreSQL serverless) via Prisma (`provider = "postgresql"`).

---

## 1. Créer un projet Neon

1. [console.neon.tech](https://console.neon.tech/) → créer un compte
2. **New Project** → nom `madrasa-app`, région **EU (Frankfurt ou Paris)**
3. Copier la **connection string** (mode **Pooled** recommandé pour Vercel)

Format typique :
```
postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/madrasa?sslmode=require
```

---

## 2. Configurer l'application

Copier `.env.example` → `.env` :

```env
DATABASE_URL="postgresql://...@ep-xxx.neon.tech/madrasa?sslmode=require"
NEXTAUTH_SECRET="..."   # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3002"
NEXT_PUBLIC_APP_URL="http://localhost:3002"
```

Appliquer le schéma et les données :

```bash
npm run db:push      # crée les tables sur Neon
npm run db:seed      # comptes démo (demo123)
# ou pour tests perf :
npm run db:seed-charge
```

Vérifier :
```bash
npm run db:test
```

---

## 3. PostgreSQL local (optionnel)

Alternative sans Neon, via Docker :

```bash
npm run db:docker
# DATABASE_URL="postgresql://madrasa:madrasa@localhost:5433/madrasa"
npm run db:push && npm run db:seed
```

---

## 4. Vercel + Neon

1. Créer le projet Neon (prod)
2. Dans **Vercel → Environment Variables** :
   - `DATABASE_URL` = connection string Neon (**Pooled**)
   - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
3. Deploy — le build exécute `prisma db push` puis `next build`

Voir aussi [docs/vercel.md](./vercel.md).

---

## 5. Migration depuis CockroachDB

Les données CockroachDB locales **ne migrent pas automatiquement**. Sur Neon :

```bash
# .env pointant vers Neon
npm run db:push
npm run db:seed          # démo
npm run db:seed-charge   # 400 élèves (optionnel)
```

---

## 6. Dépannage

| Problème | Solution |
|----------|----------|
| `P1001 Can't reach database` | Vérifier DATABASE_URL, sslmode=require |
| Login échoue | DB accessible ? `npm run db:test` |
| Session vide après seed | Se déconnecter / reconnecter |
| Vercel build échoue | DATABASE_URL dans les env Vercel (Production) |
