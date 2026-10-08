import { LegalPageShell } from "@/components/legal/LegalProse";
import { getLegalConfig } from "@/lib/legal/config";

export const metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  const legal = getLegalConfig();

  return (
    <LegalPageShell title="Mentions légales">
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

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Hébergement
        </h2>
        <p>
          {legal.hostingProvider}
          <br />
          {legal.hostingRegion}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Propriété intellectuelle
        </h2>
        <p>
          L&apos;ensemble du site et de l&apos;application {legal.appName} (textes,
          graphismes, logo, structure) est protégé. Toute reproduction non
          autorisée est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Données personnelles
        </h2>
        <p>
          Politique : /legal/confidentialite · Choix RGPD : /legal/vos-choix ·
          Suppression de compte : /legal/suppression-compte
        </p>
        <p className="text-sm">{legal.contactNotice}</p>
      </section>
    </LegalPageShell>
  );
}
