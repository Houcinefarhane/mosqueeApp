"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  COOKIE_CONSENT_KEY,
  type CookieConsentChoice,
} from "@/lib/legal/consent";

type CookieConsentProps = {
  onChoice: (choice: CookieConsentChoice) => void;
};

export default function CookieConsent({ onChoice }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const save = (choice: CookieConsentChoice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);
    onChoice(choice);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-filet bg-blanc p-4 shadow-elevated sm:p-5"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-labelledby="cookie-consent-title"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-consent-title" className="font-semibold text-foreground">
            Cookies et mesure d&apos;audience
          </p>
          <p className="mt-1 text-sm text-brun-doux">
            Les cookies essentiels (session de connexion) sont nécessaires au
            fonctionnement du service. Les cookies de mesure d&apos;audience
            (Vercel Analytics) ne sont déposés qu&apos;avec votre accord.{" "}
            <Link href="/legal/cookies" className="font-medium text-or underline-offset-2 hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 sm:min-w-[9.5rem]"
            onClick={() => save("essential")}
          >
            Tout refuser
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 flex-1 sm:min-w-[9.5rem]"
            onClick={() => save("analytics")}
          >
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
