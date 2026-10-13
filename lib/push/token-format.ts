/** Token APNs brut (Capacitor Push sans Firebase) — invalide pour Firebase Admin. */
export function isApnsDeviceTokenHex(token: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(token.trim());
}

export function isLikelyFcmToken(token: string): boolean {
  const t = token.trim();
  if (t.length < 80) return false;
  return !isApnsDeviceTokenHex(t);
}
