# Firebase & push — actions manuelles

## 1. Projet Firebase

1. [Console Firebase](https://console.firebase.google.com/) → créer un projet (ex. `madrasapp-prod`).
2. Ajouter une app **Android** (package `fr.madrasapp.mobile`) → télécharger `google-services.json` → placer dans `mobile/android/app/`.
3. Ajouter une app **iOS** (bundle `fr.madrasapp.mobile`) → télécharger `GoogleService-Info.plist` → placer dans `mobile/ios/App/App/`.

## 2. Clé Admin SDK (serveur Vercel)

1. Paramètres projet → **Comptes de service** → Générer une nouvelle clé privée JSON.
2. Dans Vercel, variables :
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (coller la clé avec `\n` pour les retours ligne)

Sans ces variables, l'app fonctionne ; seuls les envois push sont ignorés.

## 3. iOS — APNs

1. Firebase → Cloud Messaging → Apple → uploader la **clé APNs** (.p8) ou certificat.
2. Xcode → target App → **Signing & Capabilities** → **Push Notifications**.
3. `pod install` dans `mobile/ios/App`.

## 4. Android

1. Fichier `google-services.json` en place.
2. Rebuild Gradle dans Android Studio.

## 5. Test

1. Installer l'app sur un appareil réel (push peu fiable sur simulateur iOS).
2. Se connecter → accepter l'écran « Recevoir les annonces et absences » → autoriser le système.
3. Vérifier `DeviceToken` en base (Prisma Studio) après connexion.
