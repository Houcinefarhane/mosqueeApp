import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalProse";
import { getLegalConfig } from "@/lib/legal/config";

export const metadata = { title: "Suppression de compte" };

export default function SuppressionComptePage() {
  const legal = getLegalConfig();

  return (
    <LegalPageShell title="Suppression de compte">
      <p className="text-xs text-brun-doux">
        Dernière mise à jour : {legal.lastUpdated} · Version politique :{" "}
        {legal.privacyPolicyVersion}
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Pour les utilisateurs avec un compte
        </h2>
        <p>
          Conformément aux exigences du{" "}
          <strong>Google Play</strong> et de l&apos;<strong>App Store</strong>,
          vous pouvez demander la suppression de votre compte et des données
          associées directement dans l&apos;application :
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Connectez-vous à MadrasApp.</li>
          <li>
            Ouvrez le menu profil (en haut à droite) →{" "}
            <strong>Mes données (RGPD)</strong>, ou accédez à{" "}
            <Link
              href="/compte/donnees-personnelles"
              className="font-semibold text-or underline-offset-2 hover:underline"
            >
              Mes données personnelles
            </Link>
            .
          </li>
          <li>
            Utilisez <strong>Supprimer mon compte</strong> (professeur, parent,
            élève). La suppression est définitive pour le compte et la
            messagerie liée.
          </li>
        </ol>
        <p className="text-sm">
          Les comptes <strong>administrateur de mosquée</strong> ne peuvent pas
          être supprimés en self-service (protection de toute la structure).{" "}
          {legal.contactNotice}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Données conservées par la mosquée
        </h2>
        <p>
          Notes, présences, devoirs et dossiers élèves restent sous la
          responsabilité de votre mosquée (responsable de traitement). Pour
          l&apos;effacement de ces données, {legal.contactNotice.toLowerCase()}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Délai
        </h2>
        <p>
          La suppression du compte utilisateur est exécutée immédiatement via
          l&apos;application. Les sauvegardes techniques peuvent conserver des
          copies chiffrées pour une durée limitée (rotation des sauvegardes
          hébergeur), puis être effacées automatiquement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Éditeur
        </h2>
        <p>
          {legal.publisherName}
          <br />
          {legal.publisherAddress}
          <br />
          {legal.contactNotice}
        </p>
      </section>
    </LegalPageShell>
  );
}
