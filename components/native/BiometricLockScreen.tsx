"use client";

import Button from "@/components/ui/Button";
import Logo from "@/components/brand/Logo";

type BiometricLockScreenProps = {
  onUnlock: () => void;
  error?: string | null;
};

export default function BiometricLockScreen({
  onUnlock,
  error,
}: BiometricLockScreenProps) {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-nuit px-6 text-center">
      <Logo size={72} withWordmark onDark />
      <p className="mt-8 max-w-sm text-sm text-blanc/80">
        MadrasApp est verrouillée. Utilisez Face ID, Touch ID ou le code de
        votre appareil.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        className="mt-8 min-h-12 w-full max-w-xs"
        onClick={onUnlock}
      >
        Déverrouiller
      </Button>
    </div>
  );
}
