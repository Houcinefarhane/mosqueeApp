"use client";

import Button from "@/components/ui/Button";
import { COOKIE_CONSENT_KEY } from "@/lib/legal/consent";

type CookiePreferencesControlProps = {
  className?: string;
  variant?: "button" | "link";
};

export default function CookiePreferencesControl({
  className,
  variant = "button",
}: CookiePreferencesControlProps) {
  const reopen = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  };

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={reopen}
        className={className ?? "text-or underline-offset-2 hover:underline"}
      >
        Gérer les cookies
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className ?? "min-h-11"}
      onClick={reopen}
    >
      Modifier mon choix cookies
    </Button>
  );
}
