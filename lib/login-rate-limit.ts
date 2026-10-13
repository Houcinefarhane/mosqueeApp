import { prisma } from "./prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function checkLoginRateLimit(key: string): Promise<{
  allowed: boolean;
  retryAfterSec?: number;
}> {
  const now = new Date();
  const row = await prisma.loginRateLimit.findUnique({ where: { key } });

  if (!row || row.resetAt <= now) {
    await prisma.loginRateLimit.upsert({
      where: { key },
      create: { key, attempts: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
      update: { attempts: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
    });
    return { allowed: true };
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000);
    return { allowed: false, retryAfterSec };
  }

  await prisma.loginRateLimit.update({
    where: { key },
    data: { attempts: row.attempts + 1 },
  });
  return { allowed: true };
}

export async function clearLoginRateLimit(key: string): Promise<void> {
  await prisma.loginRateLimit.deleteMany({ where: { key } });
}

export function loginRateLimitKey(ip: string | null, identifier: string): string {
  const id = identifier.trim().toLowerCase();
  return `${ip ?? "unknown"}:${id}`;
}
