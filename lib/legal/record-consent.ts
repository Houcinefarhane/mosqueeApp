import { prisma } from "@/lib/prisma";
import { PRIVACY_POLICY_VERSION } from "@/lib/legal/config";

export async function recordUserConsents(
  userId: string,
  options: {
    policyVersion?: string;
    includeParentalGuardian?: boolean;
  } = {}
) {
  const version = options.policyVersion ?? PRIVACY_POLICY_VERSION;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.privacyConsentLog.create({
      data: {
        userId,
        kind: "privacy_policy",
        policyVersion: version,
      },
    });
    if (options.includeParentalGuardian) {
      await tx.privacyConsentLog.create({
        data: {
          userId,
          kind: "parental_guardian",
          policyVersion: version,
        },
      });
    }
    await tx.user.update({
      where: { id: userId },
      data: {
        privacyPolicyAcceptedAt: now,
        privacyPolicyVersion: version,
        ...(options.includeParentalGuardian
          ? { parentalConsentAt: now }
          : {}),
      },
    });
  });
}
