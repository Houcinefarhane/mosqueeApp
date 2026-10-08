"use client";

import { useCallback, useEffect, useState } from "react";
import { isNativePlatform } from "@/lib/native/is-native";
import {
  BACKGROUND_LOCK_MS,
  BIOMETRIC_LOCK_ENABLED_KEY,
  LAST_BACKGROUND_AT_KEY,
} from "@/lib/native/biometric-storage";
import BiometricLockScreen from "@/components/native/BiometricLockScreen";

export default function BiometricGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const native = isNativePlatform();

  useEffect(() => {
    if (!native) return;
    void (async () => {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: BIOMETRIC_LOCK_ENABLED_KEY });
      const on = value === "true";
      setEnabled(on);
      setLocked(on);
    })();
  }, [native]);

  useEffect(() => {
    if (!native || !enabled) return;

    let remove: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const { Preferences } = await import("@capacitor/preferences");
      const sub = await App.addListener("appStateChange", async ({ isActive }) => {
        if (!isActive) {
          await Preferences.set({
            key: LAST_BACKGROUND_AT_KEY,
            value: String(Date.now()),
          });
          return;
        }
        const { value } = await Preferences.get({ key: LAST_BACKGROUND_AT_KEY });
        const last = value ? Number(value) : 0;
        if (last && Date.now() - last >= BACKGROUND_LOCK_MS) {
          setLocked(true);
        }
      });
      remove = () => void sub.remove();
    })();

    return () => remove?.();
  }, [native, enabled]);

  const unlock = useCallback(async () => {
    setError(null);
    try {
      const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
      await BiometricAuth.authenticate({
        reason: "Déverrouiller MadrasApp",
        cancelTitle: "Annuler",
        allowDeviceCredential: true,
      });
      setLocked(false);
    } catch {
      setError("Authentification annulée ou impossible.");
    }
  }, []);

  if (!native || !enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {locked && (
        <BiometricLockScreen onUnlock={() => void unlock()} error={error} />
      )}
      <div aria-hidden={locked} className={locked ? "pointer-events-none" : undefined}>
        {children}
      </div>
    </>
  );
}
