"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Logo from "@/components/brand/Logo";
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-nuit px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-labelledby="cookie-consent-title"
    >
      <Logo size={88} withWordmark onDark />

      <p
        id="cookie-consent-title"
        className="mt-8 max-w-sm text-base font-semibold text-blanc"
      >
        Bienvenue sur MadrasApp
      </p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-blanc/75">
        Nous utilisons des cookies essentiels pour votre session. La mesure
        d&apos;audience est optionnelle et n&apos;est activée que si vous
        l&apos;acceptez.{" "}
        <Link
          href="/legal/cookies"
          className="font-medium text-or underline-offset-2 hover:underline"
        >
          En savoir plus
        </Link>
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <Button
          type="button"
          className="min-h-11 w-full"
          onClick={() => save("essential")}
        >
          Continuer
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full border-blanc/30 text-blanc hover:bg-blanc/10"
          onClick={() => save("analytics")}
        >
          Continuer avec mesure d&apos;audience
        </Button>
      </div>
    </div>
  );
}
