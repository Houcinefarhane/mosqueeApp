# Conformité RGPD — MadrasApp

Ce document complète les pages légales (`/legal/*`) et la page **Mes données** (`/compte/donnees-personnelles`).

## Ce que le code couvre

- Politique de confidentialité, mentions légales, politique cookies (pages statiques + variables `LEGAL_*`).
- Consentement obligatoire à l’inscription (tous les parcours).
- Bandeau cookies : analytics Vercel **uniquement** après acceptation « Tout accepter ».
- Export JSON des données du compte connecté (`GET /api/me/data-export`).
- Suppression de compte (`DELETE /api/me/account`) — règles selon le rôle (admin : contact requis).

## Checklist côté mosquée (responsable de traitement)

Chaque mosquée utilisant MadrasApp reste responsable des données de ses élèves et familles.

1. **Identité** — Renseigner sur Vercel (ou `.env`) : `LEGAL_PUBLISHER_NAME`, `LEGAL_PUBLISHER_ADDRESS`, `LEGAL_CONTACT_EMAIL`, éventuellement `LEGAL_DPO_EMAIL`.
2. **Registre des traitements** — Documenter : gestion scolaire, messagerie, notes, présences, comptes utilisateurs ; bases légales (exécution du contrat / intérêt légitime / consentement pour analytics).
3. **Sous-traitants** — DPA avec **Vercel** (hébergement) et **Neon** (base de données) ; conserver les preuves de signature.
4. **Durées de conservation** — Définir une politique interne (ex. dossiers élèves X ans après départ) et l’appliquer via vos processus admin.
5. **Droits des personnes** — Les utilisateurs peuvent exporter/supprimer via l’app ; pour les dossiers élèves gérés par l’admin, prévoir une procédure manuelle (email DPO/contact).
6. **Sécurité** — Mots de passe forts, accès limités par rôle, sauvegardes Neon, pas de partage des codes mosquée/élève.

## Variables d’environnement

Voir `.env.example` section `LEGAL_*`.

## Limites connues

- Pas de journal d’audit des consentements en base (case cochée validée côté API à l’inscription).
- Les admins ne peuvent pas auto-supprimer le compte mosquée via l’UI (protection des données de toute la structure).
