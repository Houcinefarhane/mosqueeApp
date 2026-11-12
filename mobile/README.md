# MadrasApp — application iOS & Android (Capacitor)

Coque native qui affiche le site **déjà déployé sur Vercel** dans une WebView. Les mises à jour métier passent par un déploiement web (pas besoin de republier l’app à chaque fix, sauf changement natif).

**URL prod par défaut :** `https://madrasa-app-pi.vercel.app`

## Prérequis

| Plateforme | Outils |
|------------|--------|
| **Commun** | Node 18+, ce dossier `mobile/` |
| **iOS** | macOS, **Xcode complet** (App Store, pas seulement Command Line Tools), CocoaPods (`brew install cocoapods`), compte Apple Developer (99 €/an) |
| **Android** | Android Studio, JDK 17, compte Google Play (25 € une fois) |

## Installation (une fois)

```bash
cd mobile
cp .env.example .env   # ajuster MADRASAPP_SERVER_URL si domaine custom
npm install
npx cap add android
npx cap add ios          # après installation de Xcode
npm run sync
```

Si `pod install` échoue : ouvrir **Xcode** une fois, accepter la licence, puis dans `mobile/ios/App` :

```bash
pod install
cd ../.. && npm run sync
```

### Icônes et splash

Sources vectorielles dans `assets/icon.svg` et `assets/splash.svg`, puis :

```bash
npm run assets
npm run sync
```

## Développement

```bash
npm run sync          # recopie www + config vers ios/ et android/
npm run open:ios      # Xcode
npm run open:android  # Android Studio
```

Dans Xcode : choisir un simulateur ou un iPhone → **Run**.  
Dans Android Studio : émulateur ou appareil USB → **Run**.

> L’app charge directement l’URL Vercel (`server.url` dans `capacitor.config.ts`). Pas besoin de lancer `npm run dev` du projet Next.js sur le téléphone.

## Vercel / auth

Sur Vercel, vérifier :

- `NEXTAUTH_URL` = **exactement** l’URL publique (ex. `https://madrasa-app-pi.vercel.app`)
- `NEXT_PUBLIC_APP_URL` = la même valeur

Si vous changez de domaine, mettez à jour `mobile/.env` et `npm run sync`.

## Publication stores

Voir **`../docs/app-store-google-play.md`** pour les URLs légales et les formulaires App Privacy / Data safety.

### Apple App Store

1. Xcode → **Product → Archive** → **Distribute App** → App Store Connect.
2. App Store Connect : app **MadrasApp**, bundle ID `fr.madrasapp.mobile`.
3. Privacy Policy URL : `https://madrasa-app-pi.vercel.app/legal/confidentialite`
4. Privacy Choices URL : `https://madrasa-app-pi.vercel.app/legal/vos-choix`
5. Catégorie **Éducation** (éviter **Kids** sauf refonte dédiée).

### Google Play

Guide détaillé : **[`../docs/android-release.md`](../docs/android-release.md)** (keystore, AAB, Firebase).

Résumé :

```bash
cd mobile
bash scripts/create-android-keystore.sh   # une fois — sauvegarder le keystore !
npm run sync
cd android && ./gradlew clean bundleRelease
```

AAB : `android/app/build/outputs/bundle/release/app-release.aab`

Push Android : placer `google-services.json` dans `android/app/` (déjà câblé via `@capacitor-firebase/messaging`).

## Identifiants

- **App ID (bundle)** : `fr.madrasapp.mobile` — modifiable dans `capacitor.config.ts` avant la première soumission si besoin.
