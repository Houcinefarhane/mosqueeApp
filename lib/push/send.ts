import { prisma } from "@/lib/prisma";
import type { PushKind } from "@/lib/push/preferences";
import { filterUsersByPushPreference } from "@/lib/push/preferences";
import { ANDROID_PUSH_CHANNEL_ID } from "@/lib/push/android-channel";
import { normalizeFirebasePrivateKey } from "@/lib/push/firebase-key";
import { isApnsDeviceTokenHex } from "@/lib/push/token-format";

export type PushPayload = {
  title: string;
  body: string;
  route: string;
};

function firebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID?.trim() &&
      process.env.FIREBASE_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_PRIVATE_KEY?.trim()
  );
}

async function getMessaging() {
  if (!firebaseConfigured()) {
    console.warn("[push] Firebase non configuré (FIREBASE_* manquant sur ce déploiement)");
    return null;
  }
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    try {
      const privateKey = normalizeFirebasePrivateKey(
        process.env.FIREBASE_PRIVATE_KEY!
      );
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID!.trim(),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!.trim(),
          privateKey,
        }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "init Firebase";
      console.warn("[push] init Firebase échouée:", msg);
      return null;
    }
  }
  return admin.messaging();
}

export async function notifyUsers(
  userIds: string[],
  kind: PushKind,
  payload: PushPayload
): Promise<void> {
  try {
    const allowed = await filterUsersByPushPreference(userIds, kind);
    if (allowed.length === 0) return;

    const tokens = await prisma.deviceToken.findMany({
      where: { userId: { in: allowed } },
      select: { id: true, token: true, platform: true },
    });

    const invalidApnsIds = tokens
      .filter((t) => t.platform === "ios" && isApnsDeviceTokenHex(t.token))
      .map((t) => t.id);
    if (invalidApnsIds.length > 0) {
      console.warn(
        "[push] suppression tokens iOS APNs (non FCM):",
        invalidApnsIds.length
      );
      await prisma.deviceToken.deleteMany({
        where: { id: { in: invalidApnsIds } },
      });
    }

    const sendable = tokens.filter(
      (t) => !(t.platform === "ios" && isApnsDeviceTokenHex(t.token))
    );
    if (sendable.length === 0) {
      console.warn("[push] aucun token FCM pour", kind, "users:", allowed.length);
      return;
    }

    const messaging = await getMessaging();
    if (!messaging) return;

    const invalidTokenIds: string[] = [];
    let sent = 0;

    await Promise.all(
      sendable.map(async ({ id, token }) => {
        try {
          await messaging.send({
            token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              route: payload.route,
            },
            android: {
              priority: "high",
              notification: { channelId: ANDROID_PUSH_CHANNEL_ID },
            },
            apns: { payload: { aps: { sound: "default" } } },
          });
          sent += 1;
        } catch (err: unknown) {
          const code =
            err && typeof err === "object" && "code" in err
              ? String((err as { code: string }).code)
              : "";
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message: string }).message)
              : "";
          console.warn("[push] send failed", {
            kind,
            code: code || "unknown",
            message: message.slice(0, 200),
          });
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-registration-token")
          ) {
            invalidTokenIds.push(id);
          }
        }
      })
    );

    if (invalidTokenIds.length > 0) {
      await prisma.deviceToken.deleteMany({
        where: { id: { in: invalidTokenIds } },
      });
    }

    if (sent === 0 && sendable.length > 0) {
      console.warn("[push] 0 message envoyé", { kind, tokens: sendable.length });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "notifyUsers";
    console.warn("[push] erreur:", msg);
  }
}
