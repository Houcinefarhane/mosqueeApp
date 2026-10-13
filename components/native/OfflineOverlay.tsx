"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Logo from "@/components/brand/Logo";
import { isNativePlatform } from "@/lib/native/is-native";

export default function OfflineOverlay() {
  const [offline, setOffline] = useState(false);
  const native = isNativePlatform();

  useEffect(() => {
    if (!native) return;

    let remove: (() => void) | undefined;
    let mounted = true;

    void (async () => {
      const { Network } = await import("@capacitor/network");
      // iOS peut signaler brièvement « hors ligne » au cold start — ne pas masquer le WebView.
      await new Promise((r) => setTimeout(r, 800));
      if (!mounted) return;
      const status = await Network.getStatus();
      if (status.connected) {
        setOffline(false);
      }

      const sub = await Network.addListener("networkStatusChange", (s) => {
        setOffline(!s.connected);
      });
      remove = () => void sub.remove();
    })();

    return () => {
      mounted = false;
      remove?.();
    };
  }, [native]);

  if (!native || !offline) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center bg-nuit px-6 text-center">
      <Logo size={64} withWordmark onDark />
      <p className="mt-6 text-lg font-semibold text-blanc">Pas de connexion</p>
      <p className="mt-2 max-w-sm text-sm text-blanc/75">
        Vérifiez le Wi‑Fi ou les données mobiles, puis réessayez.
      </p>
      <Button
        type="button"
        className="mt-8 min-h-11"
        variant="outline"
        onClick={() => window.location.reload()}
      >
        Réessayer
      </Button>
    </div>
  );
}
