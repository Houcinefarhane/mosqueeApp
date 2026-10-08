# Publication App Store & Google Play — MadrasApp

Configurer `NEXT_PUBLIC_APP_URL` en production (ex. `https://app.votre-mosquee.fr`) avant de copier les URLs ci-dessous.

Les URLs sont aussi calculées dans `getLegalConfig().urls` (voir `lib/legal/config.ts`).

## URLs à renseigner

| Usage | Chemin |
|--------|--------|
| **Politique de confidentialité** (obligatoire Apple + Google) | `/legal/confidentialite` |
| **User Privacy Choices** (Apple, recommandé) | `/legal/vos-choix` |
| **Suppression de compte** (Google Play, obligatoire si comptes) | `/legal/suppression-compte` |
| **Self-service connecté** | `/compte/donnees-personnelles` |

## Apple App Store Connect

1. **App Privacy** → Privacy Policy URL : `{APP_URL}/legal/confidentialite`
2. **User Privacy Choices URL** (optionnel) : `{APP_URL}/legal/vos-choix`
3. **Privacy Nutrition Labels** — déclarer au minimum :

| Data type | Collecté | Lié à l'utilisateur | Usage | Partagé |
|-----------|----------|---------------------|-------|---------|
| Nom, e-mail | Oui | Oui | Fonctionnalité app, compte | Non (sauf sous-traitants hébergement) |
| Contenu utilisateur (messages) | Oui | Oui | Fonctionnalité app | Non |
| Identifiants (ID compte, session) | Oui | Oui | Fonctionnalité app, sécurité | Non |
| Identifiant d'appareil (token push) | Oui **si** l'utilisateur active les notifications dans l'app mobile | Oui | Notifications (annonces, messages, absences) | Firebase (Google) pour transport APNs/FCM |
| Données d'utilisation / diagnostics | Oui **si** l'utilisateur accepte les cookies analytics | Non (agrégé Vercel) | Analytics | Vercel uniquement |

4. **App Review** : lien « Confidentialité » visible dans l'app (pied de page connecté + page login).
5. **Catégorie** : **ne pas** utiliser « Kids Category » sauf refonte sans analytics et flux très limités. Déclarer l'app **Éducation** / outil scolaire avec mineurs encadrés par la mosquée (voir politique § Mineurs).
6. **SDK** : si l'app native embarque une WebView vers le site, les mêmes règles cookies s'appliquent ; ne charger Analytics qu'après consentement.

## Google Play Console

1. **App content → Privacy policy** : `{APP_URL}/legal/confidentialite`
2. **App content → Data safety** — aligner sur la politique :

- **Data collected** : name, email, phone (optional), user IDs, messages, app activity (notes/presences metadata in app — school data).
- **Data shared** : none with third parties for ads; subprocessors Vercel/Neon for hosting (disclosed in policy).
- **Security practices** : data encrypted in transit (HTTPS).
- **Account deletion** : URL `{APP_URL}/legal/suppression-compte` + in-app path documented.
- **Analytics** : declare only if user opts in via cookie banner (Vercel Analytics).
- **Device ID / push token** : declare if push enabled; purpose « App functionality » / notifications ; not used for ads.

3. **Target audience** : si enfants possibles, remplir le questionnaire ; politique mineurs déjà dans `/legal/confidentialite`.
4. Cohérence **Data safety ↔ politique** : toute divergence peut entraîner un rejet.

## Checklist avant soumission

- [ ] `LEGAL_PUBLISHER_NAME` et `LEGAL_PUBLISHER_ADDRESS` renseignés (vraie association).
- [ ] Migration `privacy_consent` appliquée en prod (`prisma migrate deploy`).
- [ ] Test : inscription → consentement en base ; export JSON contient `consentements`.
- [ ] Test : suppression compte parent/prof/élève ; admin bloqué avec message mosquée.
- [ ] Test : bandeau cookies « Tout refuser » / « Tout accepter » même visibilité.
- [ ] Registre des traitements mosquée + DPA Vercel/Neon archivés (`docs/registre-traitements-modele.md`).

## App native (Capacitor)

Projet **`mobile/`** à la racine du dépôt :

```bash
cd mobile && cp .env.example .env && npm install && npx cap add ios && npx cap add android && npm run sync
```

Guide complet : [`mobile/README.md`](../mobile/README.md).

- L’app charge l’URL Vercel (ex. `https://madrasa-app-pi.vercel.app`).
- Les pages légales et le pied de page in-app restent ceux du site web.
- Ne pas intégrer d’analytics natifs sans consentement équivalent au bandeau cookies.
