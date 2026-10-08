import { LegalPageShell } from "@/components/legal/LegalProse";

export const metadata = { title: "Politique cookies" };

export default function CookiesPage() {
  return (
    <LegalPageShell title="Politique cookies">
      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Cookies essentiels
        </h2>
        <p>
          Indispensables à la connexion et à la sécurité de votre session
          (NextAuth). Ils ne nécessitent pas de consentement préalable car ils
          sont strictement nécessaires au service demandé.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Mesure d&apos;audience (optionnelle)
        </h2>
        <p>
          Si vous cliquez sur « Tout accepter » dans le bandeau cookies, nous
          activons <strong>Vercel Analytics</strong> : pages vues, type
          d&apos;appareil, pays (données agrégées, sans profilage publicitaire).
          Vous pouvez choisir « Refuser la mesure » : l&apos;outil n&apos;est
          pas chargé.
        </p>
        <p>
          Votre choix est enregistré dans le stockage local de votre navigateur
          (clé <code className="rounded bg-sable px-1">madras-cookie-consent</code>
          ). Vous pouvez le modifier en effaçant les données du site ou en
          vous rendant à la mosquée auprès de l&apos;administration.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-foreground">
          Paramétrer votre navigateur
        </h2>
        <p>
          Vous pouvez configurer votre navigateur pour bloquer les cookies.
          Certaines fonctionnalités (connexion) pourraient alors ne plus
          fonctionner.
        </p>
      </section>
    </LegalPageShell>
  );
}
