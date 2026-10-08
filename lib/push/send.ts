import { prisma } from "@/lib/prisma";
import type { PushKind } from "@/lib/push/preferences";
import { filterUsersByPushPreference } from "@/lib/push/preferences";
import { ANDROID_PUSH_CHANNEL_ID } from "@/lib/push/android-channel";

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
  if (!firebaseConfigured()) return null;
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    });
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
      select: { id: true, token: true },
    });
    if (tokens.length === 0) return;

    const messaging = await getMessaging();
    if (!messaging) return;

    const invalidTokenIds: string[] = [];

    await Promise.all(
      tokens.map(async ({ id, token }) => {
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
        } catch (err: unknown) {
          const code =
            err && typeof err === "object" && "code" in err
              ? String((err as { code: string }).code)
              : "";
          if (process.env.NODE_ENV === "production") {
            console.warn("[push] send failed", { kind, code: code || "unknown" });
          }
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
  } catch {
    // Ne jamais faire échouer la requête métier
  }
}
