import Link from "next/link";
import Logo from "@/components/brand/Logo";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-blanc app-background">
      <header className="border-b border-filet bg-blanc/90 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/auth/login">
            <Logo size={36} withWordmark />
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-or hover:underline"
          >
            Connexion
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="page-title mb-6">{title}</h1>
        <article className="legal-prose space-y-4 text-sm leading-relaxed text-brun-doux sm:text-base">
          {children}
        </article>
        <footer className="mt-12 border-t border-filet pt-6 text-xs text-brun-doux">
          <Link href="/legal/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/legal/mentions-legales" className="hover:underline">
            Mentions légales
          </Link>
          {" · "}
          <Link href="/legal/cookies" className="hover:underline">
            Cookies
          </Link>
        </footer>
      </main>
    </div>
  );
}
