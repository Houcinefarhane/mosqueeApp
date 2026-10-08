"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type PrivacyConsentFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  id?: string;
};

export default function PrivacyConsentField({
  checked,
  onChange,
  className,
  id = "privacy-consent",
}: PrivacyConsentFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl border border-filet bg-sable/50 p-3 text-sm text-brun-doux",
        className
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-filet text-or focus:ring-or"
        required
      />
      <span>
        J&apos;ai lu et j&apos;accepte la{" "}
        <Link
          href="/legal/confidentialite"
          className="font-semibold text-or underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          politique de confidentialité
        </Link>{" "}
        et les{" "}
        <Link
          href="/legal/cookies"
          className="font-semibold text-or underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          informations sur les cookies
        </Link>
        .
      </span>
    </label>
  );
}
