# Comptes démo — review Apple (École Démo)

Environnement **fictif**, isolé de l’AMP. Mots de passe **stables** (définis dans `lib/seed/apple-demo-accounts.ts`).

| Rôle | Email | Mot de passe |
|------|--------|----------------|
| Admin | `admin@review.ecole-demo.fr` | `ReviewAdmin-EcoleDemo2026!` |
| Professeur | `prof@review.ecole-demo.fr` | `ReviewProf-EcoleDemo2026!` |
| Élève | `eleve@review.ecole-demo.fr` | `ReviewEleve-EcoleDemo2026!` |

**URL de connexion (prod)** : https://madrasa-app-pi.vercel.app/auth/login

## (Re)créer ou resynchroniser en base

```bash
npm run db:seed-apple-demo          # crée l’école si absente ; sinon resync des mots de passe
npm run db:seed-apple-demo -- --force   # supprime et recrée toute l’École Démo
```

Un fichier copie est aussi écrit dans `data/apple-review-credentials.txt` (gitignoré) à chaque seed.

## Surcharge (optionnel)

Dans `.env` :

- `APPLE_DEMO_ADMIN_PASSWORD`
- `APPLE_DEMO_PROF_PASSWORD`
- `APPLE_DEMO_ELEVE_PASSWORD`

Ne pas publier ces identifiants sur la fiche store publique : les coller dans **App Store Connect → App Review Information**.
