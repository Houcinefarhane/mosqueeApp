-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privacyPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "privacyPolicyVersion" TEXT,
ADD COLUMN     "parentalConsentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PrivacyConsentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyConsentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivacyConsentLog_userId_idx" ON "PrivacyConsentLog"("userId");

-- CreateIndex
CREATE INDEX "PrivacyConsentLog_kind_idx" ON "PrivacyConsentLog"("kind");

-- AddForeignKey
ALTER TABLE "PrivacyConsentLog" ADD CONSTRAINT "PrivacyConsentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
