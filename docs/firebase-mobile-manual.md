# Firebase & push — actions manuelles

## 1. Projet Firebase

1. [Console Firebase](https://console.firebase.google.com/) → créer un projet (ex. `madrasapp-prod`).
2. Ajouter une app **Android** (package `fr.madrasapp.mobile`) → télécharger `google-services.json` → placer dans `mobile/android/app/`.
3. Ajouter une app **iOS** (bundle `fr.madrasapp.mobile`) → télécharger `GoogleService-Info.plist` → placer dans `mobile/ios/App/App/` et l’ajouter à la cible **App** dans Xcode (**obligatoire** pour les push : sans ce fichier, iOS n’enregistre qu’un token APNs hex, incompatible avec Firebase).

## 2. Clé Admin SDK (serveur Vercel)

1. Paramètres projet → **Comptes de service** → Générer une nouvelle clé privée JSON.
2. Dans Vercel, variables :
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (coller la clé avec `\n` pour les retours ligne)

Sans ces variables, l'app fonctionne ; seuls les envois push sont ignorés.

### Format de `FIREBASE_PRIVATE_KEY` sur Vercel

- Coller **uniquement** le champ `private_key` du JSON (pas tout le fichier).
- Soit **plusieurs lignes** (de `-----BEGIN PRIVATE KEY-----` à `-----END PRIVATE KEY-----`).
- Soit **une ligne** avec `\n` entre les morceaux (comme dans le JSON).
- **Redeploy** obligatoire après modification.

### Test serveur (sur votre Mac)

Ajoutez les 3 `FIREBASE_*` dans `.env` (copiés depuis Vercel), puis :

```bash
npx tsx scripts/test-push-user.ts fatiha.elbasssal.eleve@test.local
```

Si « Firebase configuré: oui » et pas de notif sur le téléphone → rebuild l’app Android (Run ▶).

### Logs Vercel

Après un appel / une annonce, cherchez `[push]` dans les logs de la fonction (init échouée, send failed, 0 message envoyé).

## 3. iOS — FCM + APNs

1. **`GoogleService-Info.plist`** dans `mobile/ios/App/App/` (voir étape 1).
2. `cd mobile && npm install && npm run sync` (plugin `@capacitor-firebase/messaging`).
3. Firebase → Cloud Messaging → Apple → uploader la **clé APNs** (.p8) ou certificat.
4. Xcode → target App → **Signing & Capabilities** → **Push Notifications**.
5. Rebuild l’app sur l’iPhone, reconnecter l’élève/parent : le token en base doit être un **long token FCM**, pas 64 caractères hex.

## 4. Android

1. Fichier `google-services.json` en place.
2. Rebuild Gradle dans Android Studio.

## 5. Test

1. Installer l'app sur un appareil réel (push peu fiable sur simulateur iOS).
2. Se connecter → accepter l'écran « Recevoir les annonces et absences » → autoriser le système.
3. Vérifier `DeviceToken` en base (Prisma Studio) après connexion.
