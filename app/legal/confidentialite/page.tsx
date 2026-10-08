import { LegalPageShell } from "@/components/legal/LegalProse";
import { getLegalConfig } from "@/lib/legal/config";
import Link from "next/link";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  const legal = getLegalConfig();

  return (
    <LegalPageShell title="Politique de confidentialité">
      <p className="text-xs text-brun-doux">
        Dernière mise à jour : {legal.lastUpdated} · Version :{" "}
        {legal.privacyPolicyVersion}
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          1. Responsables et éditeur
        </h2>
        <p>
          <strong>{legal.appName}</strong> est une application de gestion pour
          les écoles coraniques des mosquées.
        </p>
        <p>
          <strong>Éditeur / développeur</strong> (entité à faire figurer sur les
          stores) : {legal.publisherName}, {legal.publisherAddress}.{" "}
          {legal.contactNotice}
        </p>
        <p>
          Chaque <strong>mosquée ou association</strong> qui ouvre un espace
          agit en <strong>responsable de traitement</strong> pour les données
          des élèves, parents et enseignants (notes, présences, planning,
          messagerie scolaire). {legal.publisherName} agit en{" "}
          <strong>sous-traitant technique</strong> pour l&apos;hébergement et
          la mise à disposition de l&apos;outil.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          2. Données collectées
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Compte</strong> : nom, prénom, adresse e-mail, téléphone
            (optionnel), mot de passe (stocké hashé), rôle, identifiant mosquée.
          </li>
          <li>
            <strong>Données scolaires</strong> : classe, notes, présences,
            devoirs, appels, planning, annonces.
          </li>
          <li>
            <strong>Messagerie</strong> : objet, contenu, date, expéditeur /
            destinataire.
          </li>
          <li>
            <strong>Technique</strong> : journaux serveur (sécurité), mesure
            d&apos;audience agrégée (Vercel Analytics) uniquement si vous
            acceptez les cookies de mesure.
          </li>
          <li>
            <strong>Consentements</strong> : date et version de la politique
            acceptée à l&apos;inscription ; pour les comptes élèves,
            confirmation d&apos;accord parental ou d&apos;âge ≥ 15 ans.
          </li>
          <li>
            <strong>Notifications push</strong> (app mobile uniquement, avec votre
            accord) : identifiant d&apos;appareil (token FCM/APNs), plateforme
            iOS ou Android ; préférences par type (annonces, messages, absences).
          </li>
        </ul>
        <p className="text-sm">
          Nous ne vendons pas vos données. Pas de publicité comportementale.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          3. Finalités et bases légales
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Gestion de l&apos;école coranique</strong> (exécution du
            contrat / mission éducative) : emploi du temps, appels, notes,
            communication avec les familles.
          </li>
          <li>
            <strong>Sécurité</strong> (intérêt légitime) : authentification,
            prévention des abus, journaux techniques.
          </li>
          <li>
            <strong>Mesure d&apos;audience</strong> (consentement) : statistiques
            anonymisées via Vercel Analytics, chargées seulement après « Tout
            accepter » sur le bandeau cookies.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          4. Mineurs
        </h2>
        <p>
          L&apos;application peut être utilisée par des élèves mineurs dans le
          cadre scolaire. Pour les <strong>comptes élèves</strong>, l&apos;inscription
          exige l&apos;acceptation de la présente politique et une confirmation
          que l&apos;utilisateur a <strong>15 ans ou plus</strong> ou l&apos;accord
          de son représentant légal, conformément à l&apos;article 45 de la loi
          « Informatique et Libertés ». L&apos;inscription peut aussi être
          validée en mosquée par l&apos;administration.
        </p>
        <p>
          MadrasApp <strong>n&apos;est pas</strong> une application « Kids
          Category » Apple : elle s&apos;adresse à un écosystème scolaire encadré
          par la mosquée. Les analytics tiers ne sont pas activés sans
          consentement explicite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          5. Sous-traitants et hébergement
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>{legal.hostingProvider}</strong> — hébergement applicatif (
            {legal.hostingRegion}). Contrat de sous-traitance (DPA) disponible
            auprès de l&apos;hébergeur.
          </li>
          <li>
            <strong>{legal.databaseProvider}</strong> — base de données
            PostgreSQL chiffrée en transit (TLS).
          </li>
          <li>
            <strong>Vercel Analytics</strong> (optionnel) — uniquement après
            consentement cookies.
          </li>
          <li>
            <strong>Firebase Cloud Messaging</strong> (Google) — envoi des
            notifications push si vous les activez dans l&apos;app mobile.
          </li>
        </ul>
        <p>
          Les données sont transmises en <strong>HTTPS</strong>. Les mots de
          passe sont hashés (bcrypt).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          6. Durées de conservation et suppression
        </h2>
        <p>
          Comptes actifs : conservation tant que la mosquée maintient
          l&apos;accès. Compte utilisateur : suppression immédiate via{" "}
          <Link
            href="/compte/donnees-personnelles"
            className="text-or underline-offset-2 hover:underline"
          >
            Mes données personnelles
          </Link>{" "}
          ou selon{" "}
          <Link
            href="/legal/suppression-compte"
            className="text-or underline-offset-2 hover:underline"
          >
            ces instructions
          </Link>
          . Données pédagogiques : durées définies par la mosquée (responsable
          de traitement). Journaux techniques : durée limitée (rotation).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          7. Vos droits (RGPD)
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Accès, portabilité, effacement (compte) :{" "}
            <Link
              href="/legal/vos-choix"
              className="text-or underline-offset-2 hover:underline"
            >
              Vos choix de confidentialité
            </Link>
            .
          </li>
          <li>
            Données scolaires : {legal.contactNotice}
          </li>
          <li>
            Réclamation :{" "}
            <a
              href="https://www.cnil.fr"
              className="text-or underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              CNIL
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          8. Cookies
        </h2>
        <p>
          Voir{" "}
          <Link href="/legal/cookies" className="text-or hover:underline">
            politique cookies
          </Link>
          . Retrait du consentement : bouton « Gérer les cookies » en bas de
          l&apos;application ou sur la page Vos choix.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          9. Modifications
        </h2>
        <p>
          En cas de changement substantiel, la version ({legal.privacyPolicyVersion}
          ) sera mise à jour. Une nouvelle acceptation pourra être demandée à
          la connexion si nécessaire.
        </p>
      </section>
    </LegalPageShell>
  );
}
