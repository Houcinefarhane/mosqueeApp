"use client";

import { useEffect, useState } from "react";
import { isNativePlatform } from "@/lib/native/is-native";
import { BIOMETRIC_LOCK_ENABLED_KEY } from "@/lib/native/biometric-storage";

export default function BiometricSettingRow() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const native = isNativePlatform();

  useEffect(() => {
    if (!native) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: BIOMETRIC_LOCK_ENABLED_KEY });
      setEnabled(value === "true");
      setLoading(false);
    })();
  }, [native]);

  const toggle = async (next: boolean) => {
    if (!native) return;
    if (next) {
      try {
        const { BiometricAuth } = await import(
          "@aparajita/capacitor-biometric-auth"
        );
        await BiometricAuth.authenticate({
          reason: "Activer le verrouillage MadrasApp",
          allowDeviceCredential: true,
        });
      } catch {
        return;
      }
    }
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({
      key: BIOMETRIC_LOCK_ENABLED_KEY,
      value: next ? "true" : "false",
    });
    setEnabled(next);
  };

  if (!native) {
    return (
      <p className="text-sm text-brun-doux">
        Le verrouillage biométrique est disponible uniquement dans
        l&apos;application mobile.
      </p>
    );
  }

  if (loading) return null;

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-semibold text-foreground">
          Verrouiller avec Face ID / empreinte
        </span>
        <span className="text-sm text-brun-doux">
          Demande à l&apos;ouverture et après 1 minute en arrière-plan
        </span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 rounded border-filet text-or focus:ring-or"
        checked={enabled}
        onChange={(e) => void toggle(e.target.checked)}
      />
    </label>
  );
}
