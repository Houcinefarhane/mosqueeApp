import Link from "next/link";

export default function AuthLegalLinks() {
  return (
    <p className="text-center text-xs text-brun-doux">
      <Link href="/legal/confidentialite" className="underline-offset-2 hover:underline">
        Confidentialité
      </Link>
      {" · "}
      <Link href="/legal/mentions-legales" className="underline-offset-2 hover:underline">
        Mentions légales
      </Link>
      {" · "}
      <Link href="/legal/cookies" className="underline-offset-2 hover:underline">
        Cookies
      </Link>
      {" · "}
      <Link href="/legal/suppression-compte" className="underline-offset-2 hover:underline">
        Suppression compte
      </Link>
    </p>
  );
}
