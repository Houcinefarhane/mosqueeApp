import { LegalPageShell } from "@/components/legal/LegalProse";
import { getLegalConfig } from "@/lib/legal/config";
import Link from "next/link";

export const metadata = { title: "Politique de confidentialité" };

export default function ConfidentialitePage() {
  const legal = getLegalConfig();

  return (
    <LegalPageShell title="Politique de confidentialité">
      <p className="text-xs text-brun-doux">
        Dernière mise à jour : {legal.lastUpdated}
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          1. Qui sommes-nous ?
        </h2>
        <p>
          <strong>{legal.appName}</strong> est un logiciel de gestion pour les
          écoles coraniques des mosquées. L&apos;éditeur de la plateforme est{" "}
          <strong>{legal.publisherName}</strong>
          {legal.publisherAddress ? (
            <>
              , situé au{" "}
              <span className="whitespace-pre-line">{legal.publisherAddress}</span>
            </>
          ) : null}
          . {legal.contactNotice}
        </p>
        <p>
          Chaque <strong>mosquée ou association</strong> qui crée un espace sur{" "}
          {legal.appName} agit en qualité de{" "}
          <strong>responsable de traitement</strong> pour les données des
          élèves, parents et enseignants qu&apos;elle y enregistre (notes,
          présences, planning, etc.). {legal.publisherName} agit en qualité de{" "}
          <strong>sous-traitant</strong> pour l&apos;hébergement et la mise à
          disposition de l&apos;outil.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          2. Données traitées
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité et contact : nom, prénom, e-mail, téléphone</li>
          <li>Compte : identifiants de connexion (mot de passe chiffré)</li>
          <li>Données scolaires : classe, notes, présences, devoirs, messages</li>
          <li>Données techniques : journaux serveur, mesure d&apos;audience si vous y consentez</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          3. Finalités et bases légales
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Gestion de l&apos;école coranique</strong> (exécution du
            contrat / mission d&apos;intérêt éducatif) : emploi du temps, appels,
            notes, communication avec les familles.
          </li>
          <li>
            <strong>Sécurité du service</strong> (intérêt légitime) : authentification,
            prévention des abus.
          </li>
          <li>
            <strong>Mesure d&apos;audience</strong> (consentement) : statistiques
            anonymisées via Vercel Analytics, uniquement si vous acceptez les
            cookies de mesure.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          4. Durées de conservation
        </h2>
        <p>
          Les comptes utilisateurs sont conservés tant que la mosquée maintient
          l&apos;accès. Les données pédagogiques peuvent être conservées par la
          mosquée selon ses obligations légales et réglementaires. Les journaux
          techniques sont conservés pour une durée limitée (généralement 12 mois
          maximum).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          5. Destinataires et hébergement
        </h2>
        <p>
          Données hébergées via {legal.hostingProvider} ({legal.hostingRegion}).
          Base de données PostgreSQL (ex. Neon). Sous-traitants techniques
          listés dans les conditions de vos prestataurs (Vercel, Neon, etc.).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          6. Vos droits (RGPD)
        </h2>
        <p>Vous disposez des droits d&apos;accès, rectification, effacement, limitation, opposition et portabilité.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Compte connecté</strong> : export et suppression depuis{" "}
            <Link href="/compte/donnees-personnelles" className="text-or underline-offset-2 hover:underline">
              Mes données personnelles
            </Link>
            .
          </li>
          <li>
            <strong>Données scolaires</strong> : contactez l&apos;administration
            de votre mosquée (responsable de traitement).
          </li>
          <li>
            <strong>Réclamation</strong> : CNIL —{" "}
            <a
              href="https://www.cnil.fr"
              className="text-or underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.cnil.fr
            </a>
            .
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          7. Sécurité
        </h2>
        <p>
          Mots de passe hashés, connexions chiffrées (HTTPS), accès restreint par
          rôle (admin, professeur, parent, élève). Mesures organisationnelles
          complémentaires à définir par chaque mosquée (mots de passe forts,
          sensibilisation).
        </p>
      </section>
    </LegalPageShell>
  );
}
