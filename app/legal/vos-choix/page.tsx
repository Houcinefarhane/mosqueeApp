import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalProse";
import { getLegalConfig } from "@/lib/legal/config";
import CookiePreferencesControl from "@/components/legal/CookiePreferencesControl";

export const metadata = { title: "Vos choix de confidentialité" };

export default function VosChoixPage() {
  const legal = getLegalConfig();

  return (
    <LegalPageShell title="Vos choix de confidentialité">
      <p className="text-xs text-brun-doux">
        Page « Privacy Choices » pour App Store / Google Play ·{" "}
        {legal.lastUpdated}
      </p>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Compte connecté
        </h2>
        <p>
          Export, rectification (via votre mosquée pour les dossiers scolaires)
          et suppression de compte :
        </p>
        <p>
          <Link
            href="/compte/donnees-personnelles"
            className="font-semibold text-or underline-offset-2 hover:underline"
          >
            Mes données personnelles
          </Link>{" "}
          (connexion requise)
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Cookies et mesure d&apos;audience
        </h2>
        <p>
          Vous pouvez refuser ou accepter Vercel Analytics à tout moment. Les
          cookies de session (connexion) restent nécessaires au service.
        </p>
        <CookiePreferencesControl />
        <p className="text-sm">
          <Link href="/legal/cookies" className="text-or hover:underline">
            Politique cookies
          </Link>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Mosquée (responsable de traitement)
        </h2>
        <p>{legal.contactNotice}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Suppression de compte (lien public)
        </h2>
        <p>
          <Link
            href="/legal/suppression-compte"
            className="font-semibold text-or underline-offset-2 hover:underline"
          >
            Instructions de suppression de compte
          </Link>
        </p>
      </section>
    </LegalPageShell>
  );
}
