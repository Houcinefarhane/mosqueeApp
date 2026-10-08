"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import CookieConsent from "@/components/legal/CookieConsent";
import {
  COOKIE_CONSENT_KEY,
  type CookieConsentChoice,
} from "@/lib/legal/consent";

export default function AnalyticsWithConsent() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(
      COOKIE_CONSENT_KEY
    ) as CookieConsentChoice | null;
    if (stored === "analytics") setAnalyticsEnabled(true);
  }, []);

  return (
    <>
      <CookieConsent
        onChoice={(choice) => setAnalyticsEnabled(choice === "analytics")}
      />
      {analyticsEnabled ? <Analytics /> : null}
    </>
  );
}
