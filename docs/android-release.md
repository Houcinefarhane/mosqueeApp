# Android — build release MadrasApp (Capacitor)

## Configuration actuelle

| Élément | Valeur |
|--------|--------|
| Package | `fr.madrasapp.mobile` |
| URL WebView | `https://madrasa-app-pi.vercel.app` (`mobile/.env` → `MADRASAPP_SERVER_URL`) |
| Push | `@capacitor-firebase/messaging` + `android/app/google-services.json` |
| Canal FCM | `madrasapp_alerts` (`strings.xml`) |

## Prérequis

- JDK **17**
- Android Studio (SDK + build-tools)
- `google-services.json` dans `mobile/android/app/` (même projet Firebase que iOS)

## Icônes & splash

Alignés sur la charte iOS (marron `#1E110A`, doré `#C8962E`) :

```bash
cd mobile
npm run assets    # génère les densités Android + iOS depuis assets/*.svg
npm run sync
```

## Keystore (signature Play Store)

### Création (une fois)

```bash
cd mobile
bash scripts/create-android-keystore.sh
```

Cela crée :

- `android/keystore/release.keystore` (gitignoré)
- `android/keystore.properties` (gitignoré)

### Sauvegarder le keystore (obligatoire)

**Perdre le keystore = impossible de mettre à jour l’app** sur le même listing Google Play (il faudrait une nouvelle fiche avec un nouveau package).

Conserver **au minimum** :

1. Le fichier **`release.keystore`** (copie sur disque chiffré + cloud privé)
2. **`storePassword`** et **`keyPassword`** (souvent identiques)
3. **`keyAlias`** (`madrasapp`)

Recommandations :

- Coffre-fort (1Password, Bitwarden, etc.) avec pièce jointe `.keystore`
- Deuxième copie offline (clé USB chez un responsable de l’asso)
- **Ne pas** envoyer le keystore par email non chiffré

Google propose aussi [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756) : vous uploadez une clé d’upload ; Google signe la clé de distribution. **Sauvegardez quand même** votre clé d’upload.

## Construire l’AAB signé

```bash
cd mobile
npm run sync

cd android
./gradlew clean bundleRelease
```

AAB produit :

`mobile/android/app/build/outputs/bundle/release/app-release.aab`

Vérifier la signature :

```bash
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

## Play Console

1. Créer l’app → téléverser l’AAB
2. Privacy : `https://madrasa-app-pi.vercel.app/legal/confidentialite`
3. Suppression compte : `https://madrasa-app-pi.vercel.app/legal/suppression-compte`

Voir aussi [`docs/app-store-google-play.md`](app-store-google-play.md).
