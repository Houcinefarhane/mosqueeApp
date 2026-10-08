-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mosqueeId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotificationPreference" (
    "userId" TEXT NOT NULL,
    "annoncesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "absencesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushPromptSeenAt" TIMESTAMP(3),

    CONSTRAINT "PushNotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_mosqueeId_idx" ON "DeviceToken"("mosqueeId");

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotificationPreference" ADD CONSTRAINT "PushNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
