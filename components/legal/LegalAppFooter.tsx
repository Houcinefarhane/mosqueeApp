import Link from "next/link";
import CookiePreferencesControl from "@/components/legal/CookiePreferencesControl";

export default function LegalAppFooter() {
  return (
    <footer className="mt-8 border-t border-filet px-2 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-4 text-center text-xs text-brun-doux lg:pb-4">
      <nav className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <Link href="/legal/confidentialite" className="hover:underline">
          Confidentialité
        </Link>
        <span aria-hidden>·</span>
        <Link href="/legal/vos-choix" className="hover:underline">
          Vos choix (RGPD)
        </Link>
        <span aria-hidden>·</span>
        <Link href="/legal/suppression-compte" className="hover:underline">
          Suppression de compte
        </Link>
        <span aria-hidden>·</span>
        <Link href="/legal/cookies" className="hover:underline">
          Cookies
        </Link>
        <span aria-hidden>·</span>
        <CookiePreferencesControl variant="link" />
      </nav>
    </footer>
  );
}
