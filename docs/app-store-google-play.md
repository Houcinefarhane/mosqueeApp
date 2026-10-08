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

3. **Target audience** : si enfants possibles, remplir le questionnaire ; politique mineurs déjà dans `/legal/confidentialite`.
4. Cohérence **Data safety ↔ politique** : toute divergence peut entraîner un rejet.

## Checklist avant soumission

- [ ] `LEGAL_PUBLISHER_NAME` et `LEGAL_PUBLISHER_ADDRESS` renseignés (vraie association).
- [ ] Migration `privacy_consent` appliquée en prod (`prisma migrate deploy`).
- [ ] Test : inscription → consentement en base ; export JSON contient `consentements`.
- [ ] Test : suppression compte parent/prof/élève ; admin bloqué avec message mosquée.
- [ ] Test : bandeau cookies « Tout refuser » / « Tout accepter » même visibilité.
- [ ] Registre des traitements mosquée + DPA Vercel/Neon archivés (`docs/registre-traitements-modele.md`).

## App native (futur)

Pour une app React Native / Capacitor :

- Reprendre les mêmes URLs web pour les policies.
- Écran « Confidentialité » avec WebView ou liens externes.
- Bouton « Supprimer mon compte » → deep link `/compte/donnees-personnelles`.
- Ne pas intégrer Firebase Analytics sans consentement équivalent.
