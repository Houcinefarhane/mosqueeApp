"use client";

import { cn } from "@/lib/utils";

type ParentalGuardianConsentFieldProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  id?: string;
};

export default function ParentalGuardianConsentField({
  checked,
  onChange,
  className,
  id = "parental-consent",
}: ParentalGuardianConsentFieldProps) {
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
        Je certifie avoir <strong>15 ans ou plus</strong>, ou disposer de
        l&apos;accord de mon <strong>représentant légal</strong> (parent ou
        tuteur) pour créer ce compte élève, conformément à la loi «
        Informatique et Libertés ».
      </span>
    </label>
  );
}
