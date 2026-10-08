# Marque-page — à faire avant prod & Play Store

Repère rapide. Coche au fur et à mesure.

---

## 🔴 Urgent — Neon + Vercel (site prod)

Sans ça, les **déploiements Vercel** peuvent échouer (erreur Prisma **P1002**).

- [ ] [Console Neon](https://console.neon.tech/) → projet → **Connect**
- [ ] Copier l’URL **Direct** (host **sans** `-pooler`)
- [ ] [Vercel](https://vercel.com) → **madrasa-app** → **Settings → Environment Variables**
- [ ] Ajouter **`DIRECT_DATABASE_URL`** = URL Direct (Production + Preview)
- [ ] Laisser **`DATABASE_URL`** = URL **Pooled** (avec `-pooler`)
- [ ] **Deployments → Redeploy** le dernier commit
- [ ] Vérifier deploy **Ready** et site `https://madrasa-app-pi.vercel.app`

Détail : [`docs/vercel.md`](vercel.md) (section variables).

---

## 🟡 Google Play — prêt côté app ?

| Élément | Statut |
|--------|--------|
| App Android (Capacitor, WebView prod) | ✅ Testée sur Samsung |
| Notifications push (Firebase + Vercel) | ✅ Validées (test local + token) |
| `google-services.json` dans `mobile/android/app/` | ✅ Chez toi (ne pas committer si secret sensible — OK local) |
| Icônes / splash | ✅ Générées (`npm run assets`) |
| Bundle ID `fr.madrasapp.mobile` | ✅ |
| Pages légales en ligne | ✅ `/legal/confidentialite`, suppression compte, etc. |
| **AAB signé** (release) | ❌ À faire |
| **Compte Google Play** (25 €) | ❌ Si pas encore créé |
| Fiche store (textes) | 📝 Brouillon → [`docs/store-listing.md`](store-listing.md) |
| **Captures d’écran** (6+ Android) | ❌ À produire |
| **Data safety** Play Console | ❌ À remplir (aligné [`docs/app-store-google-play.md`](app-store-google-play.md)) |
| **SHA-256** dans `public/.well-known/assetlinks.json` | ❌ Remplacer placeholder après keystore release |
| Test **internal testing** (piste interne) | ❌ Recommandé avant production |

**Verdict :** l’app est **publiable techniquement**, mais **pas encore “prête à envoyer”** sans AAB signé, fiche Play complète, captures et Data safety.

---

## 🟢 Ordre conseillé pour Google Play

1. Finir **Neon / Vercel** (ci-dessus).
2. **Android Studio** → **Build → Generate Signed Bundle / APK** → **Android App Bundle (AAB)**  
   - Créer ou utiliser un **keystore** (sauvegarder le fichier + mots de passe — **irréversible** si perdus).
3. [Play Console](https://play.google.com/console) → créer l’app **MadrasApp** → catégorie **Éducation**.
4. Remplir **Fiche Play Store** (textes : `docs/store-listing.md`).
5. **Politique de confidentialité** : `https://madrasa-app-pi.vercel.app/legal/confidentialite`
6. **Suppression de compte** : URL + procédure in-app documentée.
7. **Data safety** + questionnaire public cible.
8. Téléverser l’**AAB** → piste **Tests internes** → testeurs (toi + bureau AMP).
9. Puis **Production** quand tout est vert.

---

## 📎 Liens utiles

| Sujet | Doc |
|--------|-----|
| Firebase mobile | [`docs/firebase-mobile-manual.md`](firebase-mobile-manual.md) |
| Play / Apple (RGPD, privacy) | [`docs/app-store-google-play.md`](app-store-google-play.md) |
| Textes store | [`docs/store-listing.md`](store-listing.md) |
| Build mobile | [`mobile/README.md`](../mobile/README.md) |

---

## iPhone (App Store)

Optionnel pour l’instant. Nécessite Mac + Xcode, `GoogleService-Info.plist`, APNs, compte Apple Developer (99 €/an).
