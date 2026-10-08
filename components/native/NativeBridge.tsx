"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isNativePlatform } from "@/lib/native/is-native";
import PushConsentModal from "@/components/native/PushConsentModal";
import OfflineOverlay from "@/components/native/OfflineOverlay";

export default function NativeBridge() {
  const { status } = useSession();
  const router = useRouter();
  const [showPushConsent, setShowPushConsent] = useState(false);

  useEffect(() => {
    if (!isNativePlatform() || status !== "authenticated") return;

    let cancelled = false;

    void (async () => {
      const prefRes = await fetch("/api/push/preferences");
      if (!prefRes.ok || cancelled) return;
      const pref = await prefRes.json();
      if (!pref.pushPromptSeenAt) {
        setShowPushConsent(true);
      } else {
        await enablePushRegistration(router);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const markPromptSeen = async () => {
    await fetch("/api/push/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushPromptSeenAt: new Date().toISOString() }),
    });
  };

  const handleAcceptPush = async () => {
    setShowPushConsent(false);
    await markPromptSeen();
    await requestPushPermission(router);
  };

  const handleDeclinePush = async () => {
    setShowPushConsent(false);
    await markPromptSeen();
  };

  if (!isNativePlatform()) return null;

  return showPushConsent ? (
    <PushConsentModal
      onAccept={() => void handleAcceptPush()}
      onDecline={() => void handleDeclinePush()}
    />
  ) : null;
}

async function enablePushRegistration(router: ReturnType<typeof useRouter>) {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { Capacitor } = await import("@capacitor/core");

  await PushNotifications.removeAllListeners();

  await PushNotifications.addListener("registration", async (ev) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: ev.value, platform }),
    });
  });

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const route = action.notification.data?.route;
      if (typeof route === "string" && route.startsWith("/")) {
        router.push(route);
      }
    }
  );

  const perm = await PushNotifications.checkPermissions();
  if (perm.receive === "granted") {
    await PushNotifications.register();
  }
}

async function requestPushPermission(router: ReturnType<typeof useRouter>) {
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive === "granted") {
    await enablePushRegistration(router);
    await PushNotifications.register();
  }
}
