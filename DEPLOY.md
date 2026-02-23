# Instructions de déploiement sur GitHub

## ✅ Étape 1 : Créer le dépôt sur GitHub

1. Va sur [GitHub](https://github.com) et connecte-toi
2. Clique sur le bouton **"+"** en haut à droite → **"New repository"**
3. Configure le dépôt :
   - **Repository name** : `madrasa-app` (ou le nom que tu préfères)
   - **Description** : "Application de gestion pour les écoles coraniques - Clone de Pronote"
   - **Visibilité** : Private (recommandé) ou Public
   - **NE PAS** cocher "Initialize with README" (on a déjà un README)
4. Clique sur **"Create repository"**

## ✅ Étape 2 : Connecter le dépôt local à GitHub

Une fois le dépôt créé, GitHub te donnera des commandes. Utilise celles-ci :

```bash
# Remplace <ton-username> et <nom-du-repo> par tes valeurs
git remote add origin https://github.com/<ton-username>/<nom-du-repo>.git
git branch -M main
git push -u origin main
```

## ✅ Étape 3 : Vérifier

Va sur ton dépôt GitHub, tu devrais voir tous les fichiers du projet.

## 🔒 Sécurité

⚠️ **IMPORTANT** : Assure-toi que le fichier `.env` est bien dans `.gitignore` (c'est déjà le cas).

Les fichiers suivants sont **ignorés** et ne seront **PAS** poussés sur GitHub :
- `.env` (tes secrets)
- `.env.local`
- `node_modules/`
- `.next/`

## 📝 Prochaines étapes

Une fois sur GitHub, tu peux :
1. Connecter le repo à Vercel pour le déploiement automatique
2. Configurer les variables d'environnement dans Vercel
3. Activer les webhooks Stripe
