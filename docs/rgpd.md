# Conformité RGPD — MadrasApp

Ce document complète les pages légales et la checklist stores (`docs/app-store-google-play.md`).

## Couverture produit (code)

| Exigence | Implémentation |
|----------|----------------|
| Information | `/legal/confidentialite`, mentions, cookies |
| Consentement inscription | Case + API Zod + journal `PrivacyConsentLog` |
| Mineurs (compte élève) | Case âge ≥ 15 ans ou accord représentant légal + journal |
| Cookies CNIL | Bandeau « Tout refuser » / « Tout accepter » (même niveau) ; retrait via « Gérer les cookies » |
| Analytics | Vercel Analytics uniquement après consentement |
| Droits | Export JSON, suppression compte, page publique suppression |
| Privacy Choices (stores) | `/legal/vos-choix` |
| Lien in-app | Pied de page connecté + menu « Mes données (RGPD) » |

## À faire côté organisation (obligatoire pour une conformité complète)

1. Renseigner `LEGAL_PUBLISHER_NAME`, `LEGAL_PUBLISHER_ADDRESS`, `NEXT_PUBLIC_APP_URL` en production.
2. Registre des traitements mosquée : `docs/registre-traitements-modele.md`.
3. DPA signés Vercel + Neon (archives).
4. Procédure incident / violation de données (72 h CNIL si applicable).
5. Durées de conservation dossiers élèves (politique interne mosquée).

## Base de données

Migration `20260408140000_privacy_consent` : champs `User.privacyPolicy*` et table `PrivacyConsentLog`.

Déploiement : `npm run db:migrate:deploy` (Vercel build).

## Limites

- Comptes créés par l'admin sans passer par l'inscription publique : consentement à documenter côté mosquée (papier / accueil).
- La conformité juridique finale dépend du contexte de chaque mosquée ; ce package vise les exigences techniques et documentaires App Store / Play Store.
