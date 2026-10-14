-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telephoneNormalized" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "familyKey" TEXT;

-- AlterTable
ALTER TABLE "Eleve" ADD COLUMN IF NOT EXISTS "dateNaissance" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LoginRateLimit" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_telephoneNormalized_key" ON "User"("telephoneNormalized");
CREATE INDEX IF NOT EXISTS "User_telephoneNormalized_idx" ON "User"("telephoneNormalized");
CREATE INDEX IF NOT EXISTS "User_familyKey_idx" ON "User"("familyKey");
